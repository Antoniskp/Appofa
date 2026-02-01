import Link from 'next/link';
import Image from 'next/image';

/**
 * AdvertisingBox component displays a visually appealing call-to-action box
 * for community participation and donations. Appears above the footer on all pages.
 * 
 * @returns {JSX.Element} The AdvertisingBox component
 */
export default function AdvertisingBox() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200">
      <div className="app-container py-4">
        <div className="bg-white rounded-lg shadow-md p-4 md:p-5 border border-blue-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left side - Motivational text */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold text-blue-900 mb-2">
                Γίνε μέρος της κοινότητας!
              </h2>
              <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                Η φωνή σου έχει δύναμη! Συμμετέχε γράφοντας άρθρα, αναφέροντας προβλήματα, 
                ψηφίζοντας σε δημοσκοπήσεις, οργανώνοντας την κοινότητά σου ή στηρίζοντας 
                το όραμά μας με μια δωρεά. Μαζί χτίζουμε μια καλύτερη κοινωνία!
              </p>
            </div>

            {/* Center - Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Link 
                href="/contribute"
                className="inline-flex items-center justify-center bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow hover:shadow-md text-sm"
              >
                Συμμετοχή
                <svg 
                  className="w-4 h-4 ml-2" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 7l5 5m0 0l-5 5m5-5H6" 
                  />
                </svg>
              </Link>
            </div>

            {/* Right side - QR code for donations */}
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs text-gray-600 font-medium">Δωρεά</p>
              <Image 
                src="/images/branding/qr-code (1).png" 
                alt="QR Code για δωρεά" 
                width={80} 
                height={80}
                className="rounded border border-gray-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
