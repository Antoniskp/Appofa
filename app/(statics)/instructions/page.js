import Link from 'next/link';
import StaticPageLayout from '@/components/StaticPageLayout';
import { getTranslations } from 'next-intl/server';

const SITE_URL = process.env.SITE_URL || 'https://appofasi.gr';

export async function generateMetadata() {
  const tStatic = await getTranslations('static_pages');
  const title = tStatic('instructions_meta_title');
  const description = tStatic('instructions_meta_description');

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/instructions`,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/instructions`,
    },
  };
}

export default async function InstructionsPage() {
  const tStatic = await getTranslations('static_pages');
  return (
    <StaticPageLayout title={tStatic('instructions_title')} breadcrumb={<Link href="/pages" className="text-gray-500 hover:text-blue-600 transition-colors">{tStatic("instructions_page_001")}{tStatic('pages')}</Link>}>
          {/* Section 1: Introduction */}
          <section>
            <h2 className="text-2xl font-semibold mb-3">{tStatic("instructions_page_002")}</h2>
            <p className="text-gray-700 mb-4">{tStatic("instructions_page_003")}</p>
          </section>
    
          {/* Section 2: Application Features Overview */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">{tStatic("instructions_page_004")}</h2>
              <p className="text-gray-700 mb-4">{tStatic("instructions_page_005")}</p>
            </div>
    
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-600 p-5 rounded-r-lg">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">{tStatic("instructions_page_006")}</h3>
                <p className="text-gray-700 mb-3">{tStatic("instructions_page_007")}</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><span className="font-semibold">{tStatic("instructions_page_008")}</span>{tStatic("instructions_page_009")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_010")}</span>{tStatic("instructions_page_011")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_012")}</span>{tStatic("instructions_page_013")}</li>
                </ul>
                <p className="text-gray-700 mt-3">{tStatic("instructions_page_014")}</p>
              </div>
    
              <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-600 p-5 rounded-r-lg">
                <h3 className="text-xl font-semibold text-green-900 mb-3">{tStatic("instructions_page_015")}</h3>
                <p className="text-gray-700 mb-3">{tStatic("instructions_page_016")}</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><span className="font-semibold">{tStatic("instructions_page_017")}</span>{tStatic("instructions_page_018")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_019")}</span>{tStatic("instructions_page_020")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_021")}</span>{tStatic("instructions_page_022")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_023")}</span>{tStatic("instructions_page_024")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_025")}</span>{tStatic("instructions_page_026")}</li>
                </ul>
              </div>
    
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-l-4 border-purple-600 p-5 rounded-r-lg">
                <h3 className="text-xl font-semibold text-purple-900 mb-3">{tStatic("instructions_page_027")}</h3>
                <p className="text-gray-700 mb-3">{tStatic("instructions_page_028")}</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><span className="font-semibold">{tStatic("instructions_page_029")}</span>{tStatic("instructions_page_030")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_031")}</span>{tStatic("instructions_page_032")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_033")}</span>{tStatic("instructions_page_034")}</li>
                </ul>
              </div>
    
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-l-4 border-orange-600 p-5 rounded-r-lg">
                <h3 className="text-xl font-semibold text-orange-900 mb-3">{tStatic("instructions_page_035")}</h3>
                <p className="text-gray-700 mb-3">{tStatic("instructions_page_036")}</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><span className="font-semibold">{tStatic("instructions_page_037")}</span>{tStatic("instructions_page_038")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_039")}</span>{tStatic("instructions_page_040")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_041")}</span>{tStatic("instructions_page_042")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_043")}</span>{tStatic("instructions_page_044")}</li>
                </ul>
              </div>
            </div>
          </section>
    
          {/* Section 3: User Roles */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">{tStatic("instructions_page_045")}</h2>
              <p className="text-gray-700 mb-4">{tStatic("instructions_page_046")}</p>
            </div>
    
            <div className="space-y-5">
              {/* Admin Role */}
              <div className="border-2 border-red-300 rounded-lg p-5 bg-red-50">
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-3">{tStatic("instructions_page_047")}</span>
                  <h3 className="text-xl font-bold text-red-900">{tStatic("instructions_page_048")}</h3>
                </div>
                <p className="text-gray-700 mb-3 font-semibold">{tStatic("instructions_page_049")}</p>
                <div className="bg-white rounded p-4">
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_050")}</p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                    <li>{tStatic("instructions_page_051")}</li>
                    <li>{tStatic("instructions_page_052")}</li>
                    <li>{tStatic("instructions_page_053")}</li>
                    <li>{tStatic("instructions_page_054")}</li>
                    <li>{tStatic("instructions_page_055")}</li>
                    <li>{tStatic("instructions_page_056")}</li>
                  </ul>
                </div>
              </div>
    
              {/* Moderator Role */}
              <div className="border-2 border-yellow-300 rounded-lg p-5 bg-yellow-50">
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-3">{tStatic("instructions_page_057")}</span>
                  <h3 className="text-xl font-bold text-yellow-900">{tStatic("instructions_page_058")}</h3>
                </div>
                <p className="text-gray-700 mb-3 font-semibold">{tStatic("instructions_page_059")}</p>
                <div className="bg-white rounded p-4">
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_050")}</p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                    <li>{tStatic("instructions_page_052")}</li>
                    <li>{tStatic("instructions_page_060")}</li>
                    <li>{tStatic("instructions_page_061")}</li>
                    <li>{tStatic("instructions_page_062")}</li>
                    <li>{tStatic("instructions_page_063")}</li>
                  </ul>
                  <p className="text-sm text-gray-600 italic mt-2">{tStatic("instructions_page_064")}</p>
                </div>
              </div>
    
              {/* Editor Role */}
              <div className="border-2 border-blue-300 rounded-lg p-5 bg-blue-50">
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-3">{tStatic("instructions_page_065")}</span>
                  <h3 className="text-xl font-bold text-blue-900">{tStatic("instructions_page_066")}</h3>
                </div>
                <p className="text-gray-700 mb-3 font-semibold">{tStatic("instructions_page_067")}</p>
                <div className="bg-white rounded p-4">
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_050")}</p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                    <li>{tStatic("instructions_page_068")}</li>
                    <li>{tStatic("instructions_page_060")}</li>
                    <li>{tStatic("instructions_page_069")}</li>
                    <li>{tStatic("instructions_page_070")}</li>
                    <li>{tStatic("instructions_page_071")}</li>
                  </ul>
                  <p className="text-sm text-gray-600 italic mt-2">{tStatic("instructions_page_072")}</p>
                </div>
              </div>
    
              {/* Viewer Role */}
              <div className="border-2 border-green-300 rounded-lg p-5 bg-green-50">
                <div className="flex items-center mb-3">
                  <span className="text-3xl mr-3">{tStatic("instructions_page_073")}</span>
                  <h3 className="text-xl font-bold text-green-900">{tStatic("instructions_page_074")}</h3>
                </div>
                <p className="text-gray-700 mb-3 font-semibold">{tStatic("instructions_page_075")}</p>
                <div className="bg-white rounded p-4">
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_050")}</p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1 text-sm">
                    <li>{tStatic("instructions_page_076")}</li>
                    <li>{tStatic("instructions_page_077")}</li>
                    <li>{tStatic("instructions_page_062")}</li>
                    <li>{tStatic("instructions_page_078")}</li>
                    <li>{tStatic("instructions_page_079")}</li>
                  </ul>
                  <p className="text-sm text-gray-600 italic mt-2">{tStatic("instructions_page_080")}</p>
                </div>
              </div>
            </div>
    
            {/* Permission Matrix */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-5 mt-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">{tStatic("instructions_page_081")}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300 text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left font-semibold">{tStatic("instructions_page_082")}</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">{tStatic("instructions_page_083")}</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">{tStatic("instructions_page_084")}</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">{tStatic("instructions_page_085")}</th>
                      <th className="border border-gray-300 px-4 py-2 text-center font-semibold">{tStatic("instructions_page_086")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">{tStatic("instructions_page_087")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{tStatic("instructions_page_089")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">{tStatic("instructions_page_090")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_091")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{tStatic("instructions_page_092")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">{tStatic("instructions_page_093")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_091")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_091")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_091")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{tStatic("instructions_page_094")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_091")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_091")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">{tStatic("instructions_page_062")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{tStatic("instructions_page_095")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_091")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_091")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_091")}</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{tStatic("instructions_page_088")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
    
            {/* News Approval Workflow */}
            <div className="bg-orange-50 border-l-4 border-orange-500 p-5 rounded">
              <h3 className="text-xl font-semibold text-orange-900 mb-3">{tStatic("instructions_page_096")}</h3>
              <p className="text-gray-700 mb-3">{tStatic("instructions_page_097")}</p>
              <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                <li>{tStatic("instructions_page_098")}</li>
                <li>{tStatic("instructions_page_099")}</li>
                <li>{tStatic("instructions_page_100")}</li>
                <li>{tStatic("instructions_page_101")}</li>
                <li>{tStatic("instructions_page_102")}</li>
              </ol>
              <p className="text-sm text-gray-600 italic mt-3">{tStatic("instructions_page_103")}</p>
            </div>
          </section>
    
          {/* Section 4: Authentication System */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">{tStatic("instructions_page_104")}</h2>
              <p className="text-gray-700 mb-4">{tStatic("instructions_page_105")}</p>
            </div>
    
            <div className="space-y-4">
              <div className="border-2 border-blue-300 rounded-lg p-5 bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">{tStatic("instructions_page_106")}</h3>
                <p className="text-gray-700 mb-3">{tStatic("instructions_page_107")}</p>
                <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                  <li>{tStatic("instructions_page_108")}</li>
                  <li>{tStatic("instructions_page_109")}</li>
                  <li>{tStatic("instructions_page_110")}</li>
                  <li>{tStatic("instructions_page_111")}</li>
                </ol>
              </div>
    
              <div className="border-2 border-gray-800 rounded-lg p-5 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  <span className="inline-block mr-2">{tStatic("instructions_page_112")}</span>{tStatic("instructions_page_113")}</h3>
                <p className="text-gray-700 mb-3">{tStatic("instructions_page_114")}</p>
                
                <div className="bg-white rounded p-4 mb-3">
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_115")}</p>
                  <ol className="list-decimal pl-6 text-gray-700 space-y-2 text-sm">
                    <li>{tStatic("instructions_page_116")}</li>
                    <li>{tStatic("instructions_page_117")}</li>
                    <li>{tStatic("instructions_page_118")}</li>
                    <li>{tStatic("instructions_page_119")}</li>
                  </ol>
                </div>
    
                <div className="bg-white rounded p-4 mb-3">
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_120")}</p>
                  <p className="text-gray-700 text-sm mb-2">{tStatic("instructions_page_121")}</p>
                  <ol className="list-decimal pl-6 text-gray-700 space-y-2 text-sm">
                    <li>{tStatic("instructions_page_122")}</li>
                    <li>{tStatic("instructions_page_123")}</li>
                    <li>{tStatic("instructions_page_124")}</li>
                    <li>{tStatic("instructions_page_125")}</li>
                  </ol>
                </div>
    
                <div className="bg-green-50 border-l-4 border-green-500 p-3 mt-3">
                  <p className="text-sm font-semibold text-green-900 mb-2">{tStatic("instructions_page_126")}</p>
                  <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                    <li>{tStatic("instructions_page_127")}</li>
                    <li>{tStatic("instructions_page_128")}</li>
                    <li>{tStatic("instructions_page_129")}</li>
                    <li>{tStatic("instructions_page_130")}</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
    
          {/* Section 5: Poll System */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">{tStatic("instructions_page_131")}</h2>
              <p className="text-gray-700 mb-4">{tStatic("instructions_page_132")}</p>
            </div>
    
            {/* Creating Polls */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3 text-blue-900">{tStatic("instructions_page_133")}</h3>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded">
                <h4 className="text-lg font-semibold text-blue-900 mb-3">{tStatic("instructions_page_134")}</h4>
                <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                  <li>{tStatic("instructions_page_135")}</li>
                  <li>{tStatic("instructions_page_136")}</li>
                  <li>{tStatic("instructions_page_137")}</li>
                  <li>{tStatic("instructions_page_138")}</li>
                  <li>{tStatic("instructions_page_139")}</li>
                  <li>{tStatic("instructions_page_140")}</li>
                  <li>{tStatic("instructions_page_141")}</li>
                </ol>
              </div>
    
              <div className="space-y-4 mt-4">
                <h4 className="text-lg font-semibold text-gray-800">{tStatic("instructions_page_142")}</h4>
                
                {/* Simple Polls */}
                <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                  <h5 className="font-semibold text-green-900 mb-2">{tStatic("instructions_page_143")}</h5>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_144")}</p>
                  <div className="bg-white rounded p-3 mt-2">
                    <p className="text-sm font-semibold text-gray-800 mb-1">{tStatic("instructions_page_145")}</p>
                    <p className="text-sm text-gray-700 mb-2">{tStatic("instructions_page_146")}</p>
                    <ul className="list-disc pl-6 text-sm text-gray-700">
                      <li>{tStatic("instructions_page_147")}</li>
                      <li>{tStatic("instructions_page_148")}</li>
                      <li>{tStatic("instructions_page_149")}</li>
                      <li>{tStatic("instructions_page_150")}</li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{tStatic("instructions_page_151")}</span>{tStatic("instructions_page_152")}</p>
                  </div>
                </div>
    
                {/* Complex Polls */}
                <div className="border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                  <h5 className="font-semibold text-purple-900 mb-2">{tStatic("instructions_page_153")}</h5>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_154")}</p>
                  <div className="bg-white rounded p-3 mt-2">
                    <p className="text-sm font-semibold text-gray-800 mb-2">{tStatic("instructions_page_155")}</p>
                    <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                      <li><span className="font-semibold">{tStatic("instructions_page_156")}</span>{tStatic("instructions_page_157")}</li>
                      <li><span className="font-semibold">{tStatic("instructions_page_158")}</span>{tStatic("instructions_page_159")}</li>
                      <li><span className="font-semibold">{tStatic("instructions_page_160")}</span>{tStatic("instructions_page_161")}</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded p-3 mt-2">
                    <p className="text-sm font-semibold text-gray-800 mb-1">{tStatic("instructions_page_145")}</p>
                    <p className="text-sm text-gray-700 mb-2">{tStatic("instructions_page_162")}</p>
                    <ul className="list-none pl-0 text-sm text-gray-700 space-y-2">
                      <li>
                        <span className="font-semibold">{tStatic("instructions_page_163")}</span><br />
                        <span className="text-xs text-gray-600">{tStatic("instructions_page_164")}</span><br />
                        <span className="text-xs text-gray-600">{tStatic("instructions_page_165")}</span>
                      </li>
                      <li>
                        <span className="font-semibold">{tStatic("instructions_page_166")}</span><br />
                        <span className="text-xs text-gray-600">{tStatic("instructions_page_167")}</span><br />
                        <span className="text-xs text-gray-600">{tStatic("instructions_page_168")}</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{tStatic("instructions_page_151")}</span>{tStatic("instructions_page_169")}</p>
                  </div>
                </div>
              </div>
            </div>
    
            {/* Poll Settings */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3 text-blue-900">{tStatic("instructions_page_170")}</h3>
              <p className="text-gray-700 mb-3">{tStatic("instructions_page_171")}</p>
    
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border border-gray-300 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_172")}</h4>
                  <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                    <li><span className="font-semibold">{tStatic("instructions_page_173")}</span>{tStatic("instructions_page_174")}</li>
                    <li><span className="font-semibold">{tStatic("instructions_page_175")}</span>{tStatic("instructions_page_176")}</li>
                  </ul>
                </div>
    
                <div className="border border-gray-300 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_177")}</h4>
                  <p className="text-sm text-gray-700 mb-2">{tStatic("instructions_page_178")}</p>
                  <p className="text-xs text-gray-600 italic">{tStatic("instructions_page_179")}</p>
                </div>
    
                <div className="border border-gray-300 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_180")}</h4>
                  <p className="text-sm text-gray-700 mb-2">{tStatic("instructions_page_181")}</p>
                  <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                    <li><span className="font-semibold">{tStatic("instructions_page_182")}</span>{tStatic("instructions_page_183")}</li>
                    <li><span className="font-semibold">{tStatic("instructions_page_184")}</span>{tStatic("instructions_page_185")}</li>
                    <li><span className="font-semibold">{tStatic("instructions_page_186")}</span>{tStatic("instructions_page_187")}</li>
                  </ul>
                </div>
    
                <div className="border border-gray-300 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_188")}</h4>
                  <p className="text-sm text-gray-700 mb-2">{tStatic("instructions_page_189")}</p>
                  <p className="text-xs text-gray-600 italic">{tStatic("instructions_page_190")}</p>
                </div>
    
                <div className="border border-gray-300 rounded-lg p-4 bg-white">
                  <h4 className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_191")}</h4>
                  <p className="text-sm text-gray-700 mb-2">{tStatic("instructions_page_192")}</p>
                  <p className="text-xs text-gray-600 italic">{tStatic("instructions_page_193")}</p>
                </div>
              </div>
            </div>
    
            {/* Voting in Polls */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3 text-blue-900">{tStatic("instructions_page_194")}</h3>
              
              <div className="bg-green-50 border-l-4 border-green-500 p-5 rounded">
                <h4 className="text-lg font-semibold text-green-900 mb-3">{tStatic("instructions_page_195")}</h4>
                <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                  <li>{tStatic("instructions_page_196")}</li>
                  <li>{tStatic("instructions_page_197")}</li>
                  <li>{tStatic("instructions_page_198")}</li>
                  <li>{tStatic("instructions_page_199")}</li>
                  <li>{tStatic("instructions_page_200")}</li>
                </ol>
                <div className="bg-white rounded p-3 mt-3">
                  <p className="text-sm font-semibold text-gray-800 mb-1">{tStatic("instructions_page_201")}</p>
                  <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                    <li>{tStatic("instructions_page_202")}</li>
                    <li>{tStatic("instructions_page_203")}</li>
                    <li>{tStatic("instructions_page_204")}</li>
                  </ul>
                </div>
              </div>
            </div>
    
            {/* Viewing Results */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3 text-blue-900">{tStatic("instructions_page_205")}</h3>
              
              <div className="bg-purple-50 border-l-4 border-purple-500 p-5 rounded">
                <h4 className="text-lg font-semibold text-purple-900 mb-3">{tStatic("instructions_page_206")}</h4>
                <p className="text-gray-700 mb-3">{tStatic("instructions_page_207")}</p>
                
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="bg-white rounded p-3 border border-purple-200">
                    <p className="font-semibold text-gray-800 text-sm mb-1">{tStatic("instructions_page_208")}</p>
                    <p className="text-xs text-gray-600">{tStatic("instructions_page_209")}</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-purple-200">
                    <p className="font-semibold text-gray-800 text-sm mb-1">{tStatic("instructions_page_210")}</p>
                    <p className="text-xs text-gray-600">{tStatic("instructions_page_211")}</p>
                  </div>
                  <div className="bg-white rounded p-3 border border-purple-200">
                    <p className="font-semibold text-gray-800 text-sm mb-1">{tStatic("instructions_page_212")}</p>
                    <p className="text-xs text-gray-600">{tStatic("instructions_page_213")}</p>
                  </div>
                </div>
    
                <div className="bg-white rounded p-3 mt-3">
                  <p className="text-sm font-semibold text-gray-800 mb-2">{tStatic("instructions_page_214")}</p>
                  <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                    <li>{tStatic("instructions_page_215")}</li>
                    <li>{tStatic("instructions_page_216")}</li>
                    <li>{tStatic("instructions_page_217")}</li>
                    <li>{tStatic("instructions_page_218")}</li>
                  </ul>
                </div>
              </div>
            </div>
    
            {/* Poll Tips */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-5 rounded">
              <h4 className="text-lg font-semibold text-yellow-900 mb-3">{tStatic("instructions_page_219")}</h4>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{tStatic("instructions_page_220")}</li>
                <li>{tStatic("instructions_page_221")}</li>
                <li>{tStatic("instructions_page_222")}</li>
                <li>{tStatic("instructions_page_223")}</li>
                <li>{tStatic("instructions_page_224")}</li>
                <li>{tStatic("instructions_page_225")}</li>
              </ul>
            </div>
          </section>
    
          {/* Section 6: Getting Started */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">{tStatic("instructions_page_226")}</h2>
              <p className="text-gray-700 mb-4">{tStatic("instructions_page_227")}</p>
              <ol className="list-decimal pl-6 text-gray-700 space-y-3">
                <li>{tStatic("instructions_page_228")}</li>
                <li>{tStatic("instructions_page_229")}</li>
                <li>{tStatic("instructions_page_230")}</li>
                <li>{tStatic("instructions_page_231")}</li>
              </ol>
            </div>
          </section>
    
          {/* Section 7: Article Types */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">{tStatic("instructions_page_232")}</h2>
              <p className="text-gray-700 mb-4">{tStatic("instructions_page_233")}</p>
            </div>
    
            <div className="space-y-4">
              <div className="border-2 border-indigo-300 rounded-lg p-5 bg-indigo-50">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">{tStatic("instructions_page_234")}</h3>
                <p className="text-gray-700 mb-2">{tStatic("instructions_page_235")}</p>
                <div className="bg-white rounded p-3 mt-2">
                  <p className="text-sm font-semibold text-gray-800 mb-1">{tStatic("instructions_page_236")}</p>
                  <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                    <li>{tStatic("instructions_page_237")}</li>
                    <li>{tStatic("instructions_page_238")}</li>
                    <li>{tStatic("instructions_page_239")}</li>
                  </ul>
                </div>
              </div>
    
              <div className="border-2 border-blue-300 rounded-lg p-5 bg-blue-50">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">{tStatic("instructions_page_240")}</h3>
                <p className="text-gray-700 mb-2">{tStatic("instructions_page_241")}</p>
                <div className="bg-white rounded p-3 mt-2">
                  <p className="text-sm font-semibold text-gray-800 mb-1">{tStatic("instructions_page_236")}</p>
                  <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                    <li>{tStatic("instructions_page_237")}</li>
                    <li>{tStatic("instructions_page_242")}</li>
                    <li>{tStatic("instructions_page_243")}</li>
                  </ul>
                </div>
              </div>
    
              <div className="border-2 border-red-300 rounded-lg p-5 bg-red-50">
                <h3 className="text-lg font-semibold text-red-900 mb-2">{tStatic("instructions_page_244")}</h3>
                <p className="text-gray-700 mb-2">{tStatic("instructions_page_245")}</p>
                <div className="bg-white rounded p-3 mt-2">
                  <p className="text-sm font-semibold text-gray-800 mb-1">{tStatic("instructions_page_236")}</p>
                  <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                    <li><span className="font-semibold text-red-700">{tStatic("instructions_page_246")}</span>{tStatic("instructions_page_247")}</li>
                    <li>{tStatic("instructions_page_248")}</li>
                    <li>{tStatic("instructions_page_249")}</li>
                    <li>{tStatic("instructions_page_250")}</li>
                  </ul>
                </div>
                <div className="bg-orange-50 border-l-4 border-orange-400 p-3 mt-2">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">{tStatic("instructions_page_201")}</span>{tStatic("instructions_page_251")}</p>
                </div>
              </div>
            </div>
          </section>
    
                {/* Section 8: Article Fields */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4">{tStatic("instructions_page_252")}</h2>
              <p className="text-gray-700 mb-6">{tStatic("instructions_page_253")}</p>
            </div>
    
            {/* Mandatory Fields */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3 text-blue-900">{tStatic("instructions_page_254")}</h3>
              <p className="text-gray-700 mb-4">{tStatic("instructions_page_255")}</p>
    
              <div className="space-y-4 pl-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{tStatic("instructions_page_256")}</h4>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_257")}</p>
                  <p className="text-sm text-gray-600 italic">{tStatic("instructions_page_258")}</p>
                </div>
    
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{tStatic("instructions_page_259")}</h4>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_260")}</p>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-3">
                    <p className="text-sm font-semibold text-blue-900 mb-2">{tStatic("instructions_page_261")}</p>
                    <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                      <li>{tStatic("instructions_page_262")}</li>
                      <li>{tStatic("instructions_page_263")}</li>
                      <li>{tStatic("instructions_page_264")}</li>
                      <li>{tStatic("instructions_page_265")}</li>
                    </ul>
                  </div>
                </div>
    
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{tStatic("instructions_page_266")}</h4>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_267")}</p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li><span className="font-semibold">{tStatic("instructions_page_268")}</span>{tStatic("instructions_page_269")}</li>
                    <li><span className="font-semibold">{tStatic("instructions_page_270")}</span>{tStatic("instructions_page_271")}</li>
                    <li><span className="font-semibold">{tStatic("instructions_page_272")}</span>{tStatic("instructions_page_273")}</li>
                  </ul>
                </div>
              </div>
            </div>
    
            {/* Categories and Tags */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3 text-blue-900">{tStatic("instructions_page_274")}</h3>
              
              <div className="space-y-4 pl-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{tStatic("instructions_page_275")}</h4>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_276")}</p>
                  <p className="text-sm text-gray-600 italic">{tStatic("instructions_page_277")}</p>
                </div>
    
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{tStatic("instructions_page_278")}</h4>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_279")}</p>
                  <p className="text-sm text-gray-600 italic">{tStatic("instructions_page_280")}</p>
                </div>
              </div>
            </div>
    
            {/* Additional Options */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3 text-blue-900">{tStatic("instructions_page_281")}</h3>
              <p className="text-gray-700 mb-4">{tStatic("instructions_page_282")}</p>
    
              <div className="space-y-4 pl-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{tStatic("instructions_page_283")}</h4>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_284")}</p>
                </div>
    
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{tStatic("instructions_page_285")}</h4>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_286")}</p>
                </div>
    
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{tStatic("instructions_page_287")}</h4>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_288")}</p>
                  <p className="text-sm text-gray-600 italic">{tStatic("instructions_page_289")}</p>
                </div>
    
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{tStatic("instructions_page_290")}</h4>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_291")}</p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                    <li><span className="font-semibold">{tStatic("instructions_page_292")}</span>{tStatic("instructions_page_293")}</li>
                    <li><span className="font-semibold">{tStatic("instructions_page_294")}</span>{tStatic("instructions_page_295")}</li>
                  </ul>
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-3">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">{tStatic("instructions_page_296")}</p>
                    <p className="text-sm text-gray-700">{tStatic("instructions_page_297")}</p>
                  </div>
                </div>
    
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{tStatic("instructions_page_298")}</h4>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_299")}</p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                    <li><span className="font-semibold">{tStatic("instructions_page_300")}</span>{tStatic("instructions_page_301")}</li>
                    <li><span className="font-semibold">{tStatic("instructions_page_302")}</span>{tStatic("instructions_page_303")}</li>
                  </ul>
                </div>
    
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{tStatic("instructions_page_304")}</h4>
                  <p className="text-gray-700 mb-2">{tStatic("instructions_page_305")}</p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                    <li>
                      <span className="font-semibold">{tStatic("instructions_page_306")}</span>{tStatic("instructions_page_307")}<span className="text-orange-700">{tStatic("instructions_page_308")}</span>
                    </li>
                    <li>
                      <span className="font-semibold">{tStatic("instructions_page_309")}</span>{tStatic("instructions_page_310")}</li>
                  </ul>
                </div>
              </div>
            </div>
    
            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3 text-blue-900">{tStatic("instructions_page_311")}</h3>
              <p className="text-gray-700 mb-3">{tStatic("instructions_page_312")}</p>
              
              <div className="bg-white border-2 border-purple-300 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">{tStatic("instructions_page_313")}</h4>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li><span className="font-semibold">{tStatic("instructions_page_314")}</span>{tStatic("instructions_page_315")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_316")}</span>{tStatic("instructions_page_317")}</li>
                  <li><span className="font-semibold">{tStatic("instructions_page_318")}</span>{tStatic("instructions_page_319")}</li>
                </ul>
              </div>
    
              <div className="bg-green-50 border-l-4 border-green-500 p-4 mt-3">
                <h4 className="font-semibold text-green-900 mb-2">{tStatic("instructions_page_320")}</h4>
                <ol className="list-decimal pl-6 text-gray-700 space-y-2">
                  <li>{tStatic("instructions_page_321")}</li>
                  <li>{tStatic("instructions_page_322")}</li>
                  <li>{tStatic("instructions_page_323")}</li>
                </ol>
              </div>
    
              <div className="bg-blue-50 p-4 mt-3 rounded">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">{tStatic("instructions_page_324")}</span>{tStatic("instructions_page_325")}</p>
              </div>
            </div>
          </section>
    
                {/* Section 9: Adding Media */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">{tStatic("instructions_page_326")}</h2>
              <p className="text-gray-700 mb-4">{tStatic("instructions_page_327")}</p>
            </div>
    
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3">{tStatic("instructions_page_328")}</h3>
              <p className="text-gray-700 mb-3">{tStatic("instructions_page_329")}</p>
              
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                <code className="text-gray-800">
                  {tStatic("instructions_page_330")}
                </code>
              </div>
    
              <p className="text-gray-700 mt-3">{tStatic("instructions_page_331")}</p>
    
              <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                <code className="text-gray-800">
                  {tStatic("instructions_page_332")}
                </code>
              </div>
            </div>
    
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3">{tStatic("instructions_page_333")}</h3>
              <p className="text-gray-700 mb-3">{tStatic("instructions_page_334")}</p>
    
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_335")}</p>
                  <div className="bg-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
                    <code className="text-gray-800">
                      {tStatic("instructions_page_336")}
                    </code>
                  </div>
                </div>
    
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">{tStatic("instructions_page_337")}</p>
                  <ol className="list-decimal pl-6 text-sm text-gray-700 space-y-1">
                    <li>{tStatic("instructions_page_338")}</li>
                    <li>{tStatic("instructions_page_339")}</li>
                    <li>{tStatic("instructions_page_340")}</li>
                    <li>{tStatic("instructions_page_341")}</li>
                  </ol>
                </div>
              </div>
            </div>
          </section>
    
                {/* Section 10: Formatting Text */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">{tStatic("instructions_page_342")}</h2>
              <p className="text-gray-700 mb-4">{tStatic("instructions_page_343")}</p>
            </div>
    
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-3">{tStatic("instructions_page_344")}</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_345")}</p>
                  <div className="bg-gray-100 p-4 rounded-md font-mono text-sm space-y-1">
                    <div><code className="text-gray-800">{tStatic("instructions_page_346")}</code></div>
                    <div><code className="text-gray-800">{tStatic("instructions_page_347")}</code></div>
                    <div><code className="text-gray-800">{tStatic("instructions_page_348")}</code></div>
                  </div>
                </div>
    
                <div>
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_349")}</p>
                  <div className="bg-gray-100 p-4 rounded-md font-mono text-sm space-y-1">
                    <div><code className="text-gray-800">{tStatic("instructions_page_350")}</code></div>
                    <div><code className="text-gray-800">{tStatic("instructions_page_351")}</code></div>
                    <div><code className="text-gray-800">{tStatic("instructions_page_352")}</code></div>
                  </div>
                </div>
    
                <div>
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_353")}</p>
                  <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                    <code className="text-gray-800">
                      {tStatic("instructions_page_354")}
                    </code>
                  </div>
                </div>
    
                <div>
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_355")}</p>
                  <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                    <code className="text-gray-800">
                      {tStatic("instructions_page_356")}
                    </code>
                  </div>
                </div>
    
                <div>
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_357")}</p>
                  <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                    <code className="text-gray-800">
                      {tStatic("instructions_page_358")}
                    </code>
                  </div>
                </div>
    
                <div>
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_359")}</p>
                  <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                    <code className="text-gray-800">
                      {tStatic("instructions_page_360")}
                    </code>
                  </div>
                </div>
    
                <div>
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_361")}</p>
                  <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                    <code className="text-gray-800">
                      {tStatic("instructions_page_362")}
                    </code>
                  </div>
                </div>
    
                <div>
                  <p className="font-semibold text-gray-800 mb-2">{tStatic("instructions_page_363")}</p>
                  <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                    <code className="text-gray-800">
                      {tStatic("instructions_page_364")}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </section>
    
                {/* Section 11: Tips and Best Practices */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">{tStatic("instructions_page_365")}</h2>
            </div>
    
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{tStatic("instructions_page_366")}</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>{tStatic("instructions_page_367")}</li>
                  <li>{tStatic("instructions_page_368")}</li>
                  <li>{tStatic("instructions_page_369")}</li>
                  <li>{tStatic("instructions_page_370")}</li>
                  <li>{tStatic("instructions_page_371")}</li>
                  <li>{tStatic("instructions_page_372")}</li>
                </ul>
              </div>
    
              <div>
                <h3 className="text-xl font-semibold mb-2">{tStatic("instructions_page_373")}</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>{tStatic("instructions_page_374")}</li>
                  <li>{tStatic("instructions_page_375")}</li>
                  <li>{tStatic("instructions_page_376")}</li>
                  <li>{tStatic("instructions_page_377")}</li>
                  <li>{tStatic("instructions_page_378")}</li>
                </ul>
              </div>
    
              <div>
                <h3 className="text-xl font-semibold mb-2">{tStatic("instructions_page_379")}</h3>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>{tStatic("instructions_page_380")}<a href="/rules" className="text-blue-600 hover:underline">{tStatic("instructions_page_381")}</a>{tStatic("instructions_page_382")}</li>
                  <li>{tStatic("instructions_page_383")}</li>
                  <li>{tStatic("instructions_page_384")}</li>
                  <li>{tStatic("instructions_page_385")}</li>
                  <li>{tStatic("instructions_page_386")}</li>
                </ul>
              </div>
            </div>
          </section>
    
                {/* Section 12: After Publishing */}
          <section className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">{tStatic("instructions_page_387")}</h2>
              <p className="text-gray-700 mb-4">{tStatic("instructions_page_388")}</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{tStatic("instructions_page_389")}</li>
                <li>{tStatic("instructions_page_390")}</li>
                <li>{tStatic("instructions_page_391")}</li>
                <li>{tStatic("instructions_page_392")}</li>
                <li>{tStatic("instructions_page_393")}</li>
              </ul>
            </div>
    
            <div>
              <h3 className="text-xl font-semibold mb-2">{tStatic("instructions_page_094")}</h3>
              <p className="text-gray-700 mb-3">{tStatic("instructions_page_394")}</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>{tStatic("instructions_page_395")}</li>
                <li>{tStatic("instructions_page_396")}</li>
                <li>{tStatic("instructions_page_397")}</li>
                <li>{tStatic("instructions_page_398")}</li>
              </ul>
            </div>
          </section>
    
                {/* Section 13: Need Help */}
          <section className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
            <h2 className="text-2xl font-semibold mb-3">{tStatic("instructions_page_399")}</h2>
            <p className="text-gray-700 mb-3">{tStatic("instructions_page_400")}</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>{tStatic("instructions_page_401")}<a href="/contact" className="text-blue-600 hover:underline font-semibold">{tStatic("instructions_page_402")}</a>{tStatic("instructions_page_403")}</li>
              <li>{tStatic("instructions_page_404")}<a href="/mission" className="text-blue-600 hover:underline font-semibold">{tStatic("instructions_page_405")}</a>{tStatic("instructions_page_406")}</li>
              <li>{tStatic("instructions_page_407")}<a href="/rules" className="text-blue-600 hover:underline font-semibold">{tStatic("instructions_page_381")}</a>{tStatic("instructions_page_408")}</li>
              <li>{tStatic("instructions_page_409")}<a href="/contribute" className="text-blue-600 hover:underline font-semibold">{tStatic("instructions_page_410")}</a>{tStatic("instructions_page_411")}</li>
            </ul>
          </section>
        </StaticPageLayout>
  );
}
