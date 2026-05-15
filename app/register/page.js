'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircleIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ToastProvider';
import FormInput from '@/components/ui/FormInput';
import OAuthButtons from '@/components/ui/OAuthButtons';
import AuthDivider from '@/components/ui/AuthDivider';
import NationalitySelector from '@/components/ui/NationalitySelector';
import CascadingLocationSelector from '@/components/ui/CascadingLocationSelector';
import { authAPI, geoAPI } from '@/lib/api';
import { useOAuthConfig } from '@/hooks/useOAuthConfig';
import Button from '@/components/ui/Button';
import DiasporaModal from '@/components/DiasporaModal';
import { useTranslations } from 'next-intl';

const STEPS = [
  { id: 1, label: 'Λογαριασμός' },
  { id: 2, label: 'Εθνικότητα & Τοποθεσία' },
  { id: 3, label: 'Επιβεβαίωση' },
];

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { register, user, loading: authLoading } = useAuth();
  const { success, error } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstNameNative: '',
    lastNameNative: '',
    nationality: '',
    homeLocationId: null,
    searchable: true,
    gdprConsent: false,
    gdprMarketing: false,
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [wantsModerator, setWantsModerator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState({ countryCode: null, countryName: null });
  const [showDiasporaModal, setShowDiasporaModal] = useState(false);
  const [pendingRegisterData, setPendingRegisterData] = useState(null);
  const { config: oauthConfig } = useOAuthConfig();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    geoAPI.detect()
      .then((res) => {
        if (res?.success && res.data?.countryCode) {
          const countryCode = String(res.data.countryCode).trim().toUpperCase();
          setDetectedCountry({ countryCode, countryName: res.data.countryName });
          if (countryCode === 'GR') {
            setFormData((prev) => {
              if (prev.nationality) return prev;
              return { ...prev, nationality: 'GR' };
            });
          }
          document.cookie = `appofa_detected_country=${countryCode}; path=/; max-age=3600; SameSite=Lax`;
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const prepareRegistrationData = (data = {}) => {
    const { confirmPassword, ...registerData } = data;
    return {
      ...registerData,
      nationality: registerData.nationality || null,
      homeLocationId: registerData.homeLocationId ?? null,
    };
  };

  const doRegister = async (data) => {
    setLoading(true);
    try {
      await register(prepareRegistrationData(data));
      success(t('register_success'));
      router.push(wantsModerator ? '/become-moderator' : '/');
    } catch (err) {
      error(err.message || t('register_fail'));
    } finally {
      setLoading(false);
    }
  };

  const updateCheckboxField = (name, checked) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleNationalityChange = (code) => {
    setFormData((prev) => ({
      ...prev,
      nationality: code || '',
    }));
  };

  const toggleGreekNationality = () => {
    setFormData((prev) => ({
      ...prev,
      nationality: prev.nationality === 'GR' ? '' : 'GR',
    }));
  };

  const handleLocationChange = (locationId) => {
    setFormData((prev) => ({
      ...prev,
      homeLocationId: locationId,
    }));
    if (!locationId) {
      setWantsModerator(false);
    }
  };

  const goToNextStepFromAccount = () => {
    if (formData.password !== formData.confirmPassword) {
      error(t('passwords_no_match'));
      return;
    }
    setCurrentStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.gdprConsent) {
      error(t('gdpr_consent_error'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      error(t('passwords_no_match'));
      return;
    }

    if (detectedCountry.countryCode && detectedCountry.countryCode !== 'GR') {
      setPendingRegisterData(prepareRegistrationData(formData));
      setShowDiasporaModal(true);
      return;
    }
    await doRegister(formData);
  };

  const handleDiasporaConfirm = async (homeLocationId) => {
    setShowDiasporaModal(false);
    setPendingRegisterData(null);
    await doRegister({
      ...pendingRegisterData,
      isDiaspora: true,
      residenceCountryCode: detectedCountry.countryCode,
      homeLocationId,
    });
  };

  const handleDiasporaDecline = async () => {
    setShowDiasporaModal(false);
    setPendingRegisterData(null);
    await doRegister(pendingRegisterData);
  };

  const handleGithubSignup = async () => {
    try {
      setLoading(true);
      const response = await authAPI.initiateGithubOAuth('login');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      error(err.message || t('github_fail'));
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setLoading(true);
      const response = await authAPI.initiateGoogleOAuth('login');
      if (response.success && response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (err) {
      error(err.message || t('google_fail'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {t('register_title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            {t('register_subtitle')}
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-6 sm:px-8">
            <div className="flex items-start justify-between gap-3">
              {STEPS.map((step, index) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;

                return (
                  <div key={step.id} className="flex flex-1 items-start">
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          isCompleted
                            ? 'border-green-500 bg-green-50 text-green-600'
                            : isCurrent
                              ? 'border-blue-500 bg-blue-50 text-blue-600'
                              : 'border-gray-200 bg-gray-50 text-gray-400'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          <span className="text-sm font-semibold">{step.id}</span>
                        )}
                      </div>
                      <span
                        className={`mt-2 text-xs font-medium sm:text-sm ${
                          isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`mx-3 mt-5 h-0.5 flex-1 ${
                          currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <form className="space-y-8 px-6 py-6 sm:px-8" onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <OAuthButtons
                    config={oauthConfig}
                    onGithubLogin={handleGithubSignup}
                    onGoogleLogin={handleGoogleSignup}
                    disabled={loading}
                  />

                  <AuthDivider text={t('or_register_with_email')} />
                </div>

                <div className="space-y-4">
                  <FormInput
                    name="username"
                    type="text"
                    label={t('username')}
                    value={formData.username}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                    placeholder={t('username')}
                  />

                  <FormInput
                    name="email"
                    type="email"
                    label={t('email')}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder={t('email')}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormInput
                      name="firstNameNative"
                      type="text"
                      label={t('first_name')}
                      value={formData.firstNameNative}
                      onChange={handleChange}
                      autoComplete="given-name"
                      placeholder={t('first_name')}
                    />
                    <FormInput
                      name="lastNameNative"
                      type="text"
                      label={t('last_name')}
                      value={formData.lastNameNative}
                      onChange={handleChange}
                      autoComplete="family-name"
                      placeholder={t('last_name')}
                    />
                  </div>

                  <FormInput
                    name="password"
                    type="password"
                    label={t('password')}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    placeholder={t('password')}
                  />

                  <FormInput
                    name="confirmPassword"
                    type="password"
                    label={t('confirm_password')}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                    placeholder={t('confirm_password')}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="button" onClick={goToNextStepFromAccount} size="md">
                    Next →
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                      <GlobeAltIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">Εθνικότητα</h3>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        Προαιρετικό
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Η εθνικότητα μας βοηθάει να σου δείχνουμε σχετικά θέματα και στατιστικά.
                  </p>

                  <button
                    type="button"
                    onClick={toggleGreekNationality}
                    className={`mt-4 flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-colors ${
                      formData.nationality === 'GR'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl" aria-hidden="true">🇬🇷</span>
                      <div>
                        <p className="font-semibold text-gray-900">Είμαι Έλληνας / Ελληνίδα</p>
                        <p className="text-sm text-gray-500">Γρήγορη επιλογή για ελληνική εθνικότητα</p>
                      </div>
                    </div>
                    {formData.nationality === 'GR' && (
                      <CheckCircleIcon className="h-6 w-6 shrink-0 text-blue-600" />
                    )}
                  </button>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Ή επίλεξε άλλη εθνικότητα:</p>
                    <NationalitySelector
                      id="nationality"
                      name="nationality"
                      value={formData.nationality === 'GR' ? '' : formData.nationality}
                      onChange={handleNationalityChange}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                      <MapPinIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">Τοποθεσία</h3>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        Προαιρετικό
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Ορίζοντας την περιοχή σου βλέπεις ειδήσεις, δημοψηφίσματα και θέματα που αφορούν εσένα άμεσα.
                    Μπορείς να το αλλάξεις οποιαδήποτε στιγμή από το προφίλ σου.
                  </p>

                  <div className="mt-4">
                    <CascadingLocationSelector
                      value={formData.homeLocationId}
                      onChange={handleLocationChange}
                      allowClear
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex gap-3">
                      <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                      <p className="text-sm text-amber-900">
                        Δεν βρίσκεις τον δήμο σου; Επίλεξε τον νομό σου — είναι αρκετό. Μπορείς πάντα να συμπληρώσεις
                        την ακριβή τοποθεσία αργότερα.
                      </p>
                    </div>
                  </div>

                  {formData.homeLocationId && (
                    <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={wantsModerator}
                          onChange={(e) => setWantsModerator(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>
                          <span className="block text-sm font-semibold text-indigo-900">
                            Θέλω να γίνω moderator για αυτή την περιοχή.
                          </span>
                          <span className="mt-1 block text-sm text-indigo-800">
                            Οι moderators επαληθεύουν τοποθεσίες και διαχειρίζονται περιεχόμενο τοπικής κοινότητας.
                            Θα σε κατευθύνουμε στη διαδικασία αίτησης μετά την εγγραφή.
                          </span>
                        </span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <div className="flex gap-3">
                    <ShieldCheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    <p className="text-sm text-blue-900">
                      Πώς επαληθεύεται η τοποθεσία μου; — Αυτή τη στιγμή η επαλήθευση γίνεται από έναν τοπικό
                      moderator. Στο μέλλον ενδέχεται να προστεθεί και η δυνατότητα επαλήθευσης με επίσημο έγγραφο
                      ταυτοποίησης.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Button type="button" variant="secondary" onClick={() => setCurrentStep(1)} size="md">
                      ← Πίσω
                    </Button>
                    <Button type="button" onClick={() => setCurrentStep(3)} size="md">
                      Επόμενο →
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Μπορείς να παραλείψεις αυτά τα πεδία και να τα συμπληρώσεις από το προφίλ σου.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Επιβεβαίωση</h3>
                  <p className="mt-1 text-sm text-gray-600">Σχεδόν έτοιμος/η! Ένα τελευταίο βήμα.</p>
                </div>

                {(formData.nationality || formData.homeLocationId) && (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">Σύνοψη επιλογών</p>
                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                      {formData.nationality && <li>Εθνικότητα: {formData.nationality}</li>}
                      {formData.homeLocationId && <li>Τοποθεσία: επιλεγμένη</li>}
                      {wantsModerator && <li>Θα ξεκινήσει η διαδικασία αίτησης για moderator.</li>}
                    </ul>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="searchable"
                      name="searchable"
                      type="checkbox"
                      checked={formData.searchable}
                      onChange={(e) => updateCheckboxField('searchable', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="searchable" className="ml-2 block text-sm text-gray-900">
                      {t('searchable')}
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      id="gdpr_consent"
                      name="gdpr_consent"
                      type="checkbox"
                      checked={formData.gdprConsent}
                      onChange={(e) => updateCheckboxField('gdprConsent', e.target.checked)}
                      required
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="gdpr_consent" className="ml-2 block text-sm text-gray-900">
                      Συμφωνώ με τους{' '}
                      <Link
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 underline hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Όρους Χρήσης
                      </Link>
                      {' '}και την{' '}
                      <Link
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 underline hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Πολιτική Απορρήτου
                      </Link>
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      id="gdpr_marketing"
                      name="gdpr_marketing"
                      type="checkbox"
                      checked={formData.gdprMarketing}
                      onChange={(e) => updateCheckboxField('gdprMarketing', e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="gdpr_marketing" className="ml-2 block text-sm text-gray-900">
                      {t('gdpr_consent_marketing')}
                    </label>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="button" variant="secondary" onClick={() => setCurrentStep(2)} size="md">
                    ← Πίσω
                  </Button>
                  <Button type="submit" loading={loading} size="md">
                    {t('submit_register')}
                  </Button>
                </div>

                <p className="text-center text-sm text-gray-600">
                  {t('already_have_account')}{' '}
                  <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    {t('submit_login')}
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
      <DiasporaModal
        isOpen={showDiasporaModal}
        detectedCountryName={detectedCountry.countryName}
        onConfirmDiaspora={handleDiasporaConfirm}
        onDecline={handleDiasporaDecline}
        onSkip={handleDiasporaDecline}
      />
    </div>
  );
}
