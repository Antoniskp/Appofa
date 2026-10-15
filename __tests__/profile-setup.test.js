/** @jest-environment <rootDir>/jest-jsdom-env.js */
const React = require('react');
const { act } = React;
const { createRoot } = require('react-dom/client');
const messages = require('../messages/en.json').profile;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
jest.mock('next-intl', () => ({ useTranslations: () => (key, values = {}) => Object.entries(values).reduce((s, [k,v]) => s.replace('{'+k+'}', v), require('../messages/en.json').profile[key] || key) }));
jest.mock('@/lib/api', () => ({ authAPI: { resendVerification: jest.fn().mockResolvedValue({ success: true }) } }));
const ProfileCompleteness = require('../components/profile/ProfileCompleteness').default;
const { useProfileSetup } = require('../hooks/useProfileSetup');
let root, container;
beforeEach(() => { localStorage.clear(); container=document.createElement('div'); document.body.appendChild(container); root=createRoot(container); });
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const click = async text => { const button=[...container.querySelectorAll('button')].find(b=>b.textContent===text); expect(button).toBeTruthy(); await act(async()=>button.click()); };
it('uses saved progress, opens location directly, and advances to interests after saving', async () => {
 const navigate=jest.fn(); const props={ user:{id:1,emailVerified:true}, savedProfileData:{}, preferences:{}, onNavigateToSection:navigate, onPreferencesChange:jest.fn() };
 await act(async()=>root.render(<ProfileCompleteness {...props}/>));
 expect(container.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('1');
 await click(messages.setup_location_action);
 expect(navigate).toHaveBeenCalledWith('location-politics','home-location-panel');
 await act(async()=>root.render(<ProfileCompleteness {...props} savedProfileData={{ homeLocationId:42 }}/>));
 expect(container.querySelector('h3').textContent).toBe(messages.setup_interests_title);
});
it('persists snooze across mounts, isolates accounts, and allows resuming', async()=>{
 function Harness({id}) { const {preferences,updatePreferences}=useProfileSetup(id); return <ProfileCompleteness user={{id}} savedProfileData={{}} preferences={preferences} onPreferencesChange={updatePreferences}/>; }
 await act(async()=>root.render(<Harness id={1}/>));
 await click(messages.setup_later);
 await act(async()=>root.render(null));
 await act(async()=>root.render(<Harness id={1}/>));
 expect(container.textContent).toContain(messages.setup_paused);
 await click(messages.setup_resume);
 expect(container.querySelector('h3').textContent).toBe(messages.setup_location_title);
 await click(messages.setup_later);
 await act(async()=>root.render(<Harness id={2}/>));
 expect(container.querySelector('h3').textContent).toBe(messages.setup_location_title);
});
it('accepts a reviewed hidden profile without requiring optional details',async()=>{
 await act(async()=>root.render(<ProfileCompleteness user={{emailVerified:true}} savedProfileData={{homeLocationId:42,interests:[{}],profileVisibility:'hidden'}} preferences={{privacyReviewed:true}}/>));
 expect(container.textContent).toContain(messages.setup_complete);
 expect(container.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('4');
});
