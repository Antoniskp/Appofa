'use strict';

const { CivicQuestion, ConsultationEvaluation, User, sequelize } = require('../models');
const { normalizeRequiredText, normalizeUrl } = require('../utils/validators');
const { createCivicQuestion } = require('./civicQuestionService');

const choices = ['reflects', 'partly', 'does_not_reflect'];

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

async function getPublisher(userId, transaction) {
  if (!userId) return null;
  const user = await User.findByPk(userId, {
    attributes: ['isVerified', 'claimStatus', 'parliamentaryPublisherName'],
    transaction,
  });
  return user?.isVerified && user.claimStatus === null ? user.parliamentaryPublisherName : null;
}

async function setPublisher(userId, name) {
  const user = await User.findByPk(userId);
  if (!user || user.claimStatus !== null) fail(404, 'Account not found.');
  if (name !== null) {
    const result = normalizeRequiredText(name, 'Official name', 2, 200);
    if (result.error) fail(400, result.error);
    if (!user.isVerified) fail(400, 'Verify the account before granting publication access.');
    name = result.value;
  }
  await user.update({ parliamentaryPublisherName: name });
  return { parliamentaryPublisherName: name };
}

async function publishQuestion(userId, input) {
  const publisherName = await getPublisher(userId);
  if (!publisherName) fail(403, 'Only approved parliamentary accounts can publish consultations.');

  const context = normalizeRequiredText(input.simplified, 'Decision context', 10, 20000);
  if (context.error) fail(400, context.error);
  const deadline = typeof input.deadline === 'string' ? new Date(input.deadline) : null;
  if (!deadline || !Number.isFinite(deadline.getTime()) || deadline <= new Date()) {
    fail(400, 'Set a voting deadline in the future.');
  }

  const result = await createCivicQuestion(userId, {
    title: input.title,
    simplified: context.value,
    pros: input.pros,
    cons: input.cons,
    originalLink: input.originalLink,
    deadline,
    dateAsked: new Date(),
    sourceType: 'parliament',
    sourceName: publisherName,
    visibility: 'public',
    voteRestriction: 'authenticated',
  }, { publisherName });

  if (!result.success) fail(result.status, result.message);
  return result.data;
}

async function findConsultation(id, transaction) {
  const question = await CivicQuestion.findByPk(id, transaction ? {
    transaction, lock: transaction.LOCK.UPDATE,
  } : {});
  if (!question?.parliamentaryConsultation || question.visibility !== 'public') {
    fail(404, 'Parliamentary consultation not found.');
  }
  return question;
}

async function publishDecision(id, userId, input) {
  const decision = normalizeRequiredText(input.decision, 'Decision', 5, 500);
  const reasoning = normalizeRequiredText(input.reasoning, 'Reasoning', 10, 4000);
  const evidenceUrl = normalizeUrl(input.evidenceUrl, 'Evidence link', false);
  const error = decision.error || reasoning.error || evidenceUrl.error;
  if (error) fail(400, error);

  return sequelize.transaction(async (transaction) => {
    const question = await findConsultation(id, transaction);
    if (question.creatorId !== userId || !await getPublisher(userId, transaction)) {
      fail(403, 'Only the approved author can publish the decision.');
    }
    if (question.parliamentaryConsultation.response) fail(409, 'The decision has already been published.');
    if (question.status === 'archived' || !question.deadline || question.deadline > new Date()) {
      fail(409, 'Publish the decision once the voting deadline has passed.');
    }

    const response = {
      decision: decision.value,
      reasoning: reasoning.value,
      evidenceUrl: evidenceUrl.value || null,
      publishedAt: new Date().toISOString(),
    };
    await question.update({
      status: 'closed',
      parliamentaryConsultation: { ...question.parliamentaryConsultation, response },
    }, { transaction });
    return response;
  });
}

async function evaluationResults(civicQuestionId, userId) {
  const where = { civicQuestionId };
  const [rows, ownEvaluation] = await Promise.all([
    ConsultationEvaluation.findAll({
      attributes: ['choice', [sequelize.fn('COUNT', sequelize.col('choice')), 'count']],
      where,
      group: ['choice'],
      raw: true,
    }),
    userId ? ConsultationEvaluation.findOne({ where: { ...where, userId }, attributes: ['choice'] }) : null,
  ]);
  const counts = Object.fromEntries(choices.map(choice => [choice, 0]));
  for (const row of rows) counts[row.choice] = Number(row.count);
  return { counts, myEvaluation: ownEvaluation?.choice || null };
}

async function getEvaluation(id, userId) {
  const question = await findConsultation(id);
  if (!question.parliamentaryConsultation.response) fail(409, 'Evaluation opens when the decision is published.');
  return evaluationResults(id, userId);
}

async function evaluate(id, userId, choice) {
  if (!choices.includes(choice)) fail(400, 'Invalid evaluation choice.');
  const question = await findConsultation(id);
  if (!question.parliamentaryConsultation.response) fail(409, 'Evaluation opens when the decision is published.');
  await ConsultationEvaluation.upsert({ civicQuestionId: id, userId, choice }, {
    conflictFields: ['civicQuestionId', 'userId'],
  });
  return evaluationResults(id, userId);
}

module.exports = { getPublisher, setPublisher, publishQuestion, publishDecision, getEvaluation, evaluate };
