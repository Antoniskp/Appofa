import { privatePageMetadata } from '@/lib/route-metadata';

export const generateMetadata = privatePageMetadata('onboarding.step_candidate_register');

export default function CandidateRegisterLayout({ children }) {
  return children;
}
