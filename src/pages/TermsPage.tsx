
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const TermsPage = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Background Image */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-[-1]">
        <img 
          src="/lovable-uploads/337fa206-d1c4-4235-be90-9434bb528158.png" 
          alt="Background" 
          className="absolute w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col h-screen p-8 max-w-4xl mx-auto w-full py-[24px] px-[20px]">
        {/* Scrollable Content Area */}
        <div className="flex-1 bg-black/20 backdrop-blur-md rounded-lg p-6 mb-2 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="text-white font-dm-sans space-y-6 pr-4">
              {/* Header Content inside scroll area */}
              <div className="mb-8">
                <h1 className="font-dm-sans text-3xl md:text-4xl font-medium text-white mb-4">
                  Incluya's privacy policy.
                </h1>
                <div className="text-white/80 font-dm-sans text-sm space-y-1">
                  <p>Effective Date: 07/09/2025</p>
                  <p>Last Updated: 07/09/2025</p>
                </div>
                <Separator className="bg-white/20 mt-6" />
              </div>
              
              <p className="text-sm leading-relaxed">
                Incluya, Inc. ("Incluya," "we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you access our website, mobile application, or related services (collectively, the "Platform").
              </p>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">1. Information We Collect</h2>
                <p className="text-sm leading-relaxed mb-4">
                  We collect the following categories of information:
                </p>
                
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">a. Information You Provide Directly</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Account Information: Name, email address, login credentials, and profile details</li>
                      <li>Communication Data: Information shared during AI interactions, surveys, feedback forms, and customer support communications</li>
                      <li>Content Submissions: Content submitted via prompts, journaling tools, reflective inputs, and user-generated content</li>
                      <li>Preferences and Settings: Platform preferences, notification settings, and customization choices</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">b. Financial Information (via Plaid Services)</h3>
                    <p className="ml-4 mb-2">
                      Important: We use Plaid Inc. ("Plaid") to securely connect to your financial accounts. When you choose to link your financial accounts:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-8">
                      <li>Account Connection Data: Bank account information, account balances, and transaction history</li>
                      <li>Financial Behavior Data: Spending patterns, transaction categories, and financial trends</li>
                      <li>Authentication Information: Information necessary to verify your identity and account ownership</li>
                    </ul>
                    <p className="ml-4 mt-2 font-semibold">Plaid's Role:</p>
                    <p className="ml-4">Plaid acts as our service provider to securely retrieve your financial data from your bank or financial institution. Plaid's collection and use of your information is governed by their privacy policy, which you can review at: <a href="https://plaid.com/legal/privacy" className="text-blue-300 hover:text-blue-200 underline" target="_blank" rel="noopener noreferrer">https://plaid.com/legal/privacy</a></p>
                    <p className="ml-4 mt-2 font-semibold">Your Control:</p>
                    <p className="ml-4">You can disconnect your financial accounts at any time through your Platform settings. Disconnecting will limit some Platform features but will not affect your existing financial accounts.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">c. Automatically Collected Information</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Device and Technical Data: IP address, browser type, device information, operating system, and mobile device identifiers</li>
                      <li>Usage Analytics: Session duration, features accessed, page views, click patterns, and user interactions</li>
                      <li>Location Data: General location information (if enabled by user) - we do not collect precise geolocation</li>
                      <li>Performance Data: Application performance metrics, error logs, and system diagnostics</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">d. AI-Generated and Inferred Information</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Behavioral Insights: AI-generated analysis of your financial behavior patterns</li>
                      <li>Personalization Data: Customized recommendations and insights based on your Platform usage</li>
                      <li>Cultural and Emotional Patterns: AI-inferred insights about cultural and emotional factors affecting your financial behavior</li>
                      <li>Interaction Logs: Records of your interactions with our AI system for service improvement</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">e. Sensitive Information Handling</h3>
                    <p className="ml-4 mb-2">
                      <span className="font-semibold">Voluntary Disclosure:</span> Incluya does not request or require personal health information, Social Security numbers, or government identification data. However, users may voluntarily input such information during AI interactions.
                    </p>
                    <p className="ml-4 mb-2">
                      <span className="font-semibold">Strong Advisory:</span> We strongly advise you not to share sensitive data unless absolutely necessary for Platform functionality.
                    </p>
                    <p className="ml-4">
                      <span className="font-semibold">Disclaimer:</span> Incluya disclaims liability for any consequences arising from the voluntary submission of sensitive data beyond what is necessary for Platform operation.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">2. How We Use Your Information</h2>
                <p className="text-sm leading-relaxed mb-4">
                  We use your information for the following purposes, based on the following lawful bases:
                </p>
                
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">a. Service Provision (Contract Performance)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Provide and personalize your experience on the Platform</li>
                      <li>Process and analyze your financial data to generate insights</li>
                      <li>Facilitate AI interactions and generate personalized recommendations</li>
                      <li>Maintain your account and Platform functionality</li>
                      <li>Provide customer support and respond to inquiries</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">b. Service Improvement (Legitimate Interest)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Improve our AI models and service offerings through analysis of user interactions</li>
                      <li>Conduct analytics to enhance product performance and user experience</li>
                      <li>Develop new features and functionality based on user behavior patterns</li>
                      <li>Perform research and development to advance our financial wellness technology</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">c. Security and Compliance (Legal Obligation/Legitimate Interest)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Ensure Platform security and prevent fraud</li>
                      <li>Comply with legal, regulatory, and contractual obligations</li>
                      <li>Protect the rights, property, and safety of Incluya, our users, and others</li>
                      <li>Maintain audit trails and compliance records</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">d. AI Model Training and Development</h3>
                    <p className="ml-4 mb-2">
                      <span className="font-semibold">Training Data Use:</span> We may use aggregated and anonymized user interactions to improve our AI models. This includes:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-8">
                      <li>Conversation patterns and response effectiveness</li>
                      <li>Financial behavior analysis accuracy</li>
                      <li>Cultural insight generation improvements</li>
                      <li>Platform performance optimization</li>
                    </ul>
                    <p className="ml-4 mt-2">
                      <span className="font-semibold">User Control:</span> You may opt out of AI model training by contacting support@incluya.com. Opting out will not affect your current Platform access but may limit future service improvements.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">e. Important Limitations</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>No Medical/Legal/Financial Advice: Data collected is not used to diagnose, treat, or monitor any medical, psychological, or financial condition, or to provide professional advice</li>
                      <li>No Automated Decision-Making: We do not use your personal data for automated decision-making that produces legal or similarly significant effects without human oversight</li>
                      <li>No Advertising: We do not use your personal data for advertising or marketing to third parties</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">3. Data Sharing and Disclosure</h2>
                <p className="text-sm leading-relaxed mb-4">
                  We do not sell your personal data. We only share your information in the following limited circumstances:
                </p>
                
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">a. Service Providers</h3>
                    <p className="ml-4 mb-2">We share information with trusted service providers under strict confidentiality agreements:</p>
                    
                    <div className="ml-4 space-y-3">
                      <div>
                        <p className="font-semibold">Financial Data Processing:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Plaid Inc.: For secure financial account connections and data retrieval. Plaid's privacy policy governs their data handling: <a href="https://plaid.com/legal/privacy" className="text-blue-300 hover:text-blue-200 underline" target="_blank" rel="noopener noreferrer">https://plaid.com/legal/privacy</a></li>
                          <li>Banking Partners: Only as necessary to facilitate account connections through Plaid</li>
                          <li>Supabase: Our backend database provider that securely stores user data such as account information and AI-generated content. Supabase processes data in accordance with Supabase Privacy Policy</li>
                          <li>Mem0: Provider of AI memory and personalized data services. Mem0 processes AI interaction data to deliver memory features, following Mem0 Privacy Policy</li>
                          <li>Cloud Hosting, Analytics, Security, and AI Service Providers: Other technical partners assist with Platform hosting, analytics, and AI processing</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-semibold">All service providers are contractually required to:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Use your data only to provide services to Incluya</li>
                          <li>Maintain robust security measures</li>
                          <li>Not use your data for their own purposes</li>
                          <li>Return or delete your data upon contract termination</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">b. Legal Requirements</h3>
                    <p className="ml-4 mb-2">We may disclose information when required by law:</p>
                    <ul className="list-disc list-inside space-y-1 ml-8">
                      <li>In response to legal requests, subpoenas, or court orders</li>
                      <li>To comply with applicable laws and regulations</li>
                      <li>To respond to claims of intellectual property infringement</li>
                      <li>To protect the rights, property, or safety of Incluya, our users, or others</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">c. Business Transfers</h3>
                    <p className="ml-4 mb-2">In the event of a merger, acquisition, or asset sale:</p>
                    <ul className="list-disc list-inside space-y-1 ml-8">
                      <li>Users will be notified via email and Platform notice</li>
                      <li>Data will be transferred only to entities that agree to honor this Privacy Policy</li>
                      <li>Users will have options to delete their data before transfer</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">d. Consent-Based Sharing</h3>
                    <p className="ml-4">We may share information with your explicit consent for specific purposes clearly disclosed at the time of consent.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">e. International Data Transfers</h3>
                    <p className="ml-4 mb-2">If data is shared outside your jurisdiction, we ensure appropriate safeguards:</p>
                    <ul className="list-disc list-inside space-y-1 ml-8">
                      <li>Standard Contractual Clauses for EU transfers</li>
                      <li>Adequacy decisions where available</li>
                      <li>Additional security measures as required by law</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">4. Data Retention</h2>
                <p className="text-sm leading-relaxed mb-4">
                  We retain your personal information according to the following principles:
                </p>
                
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">a. Retention Periods</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Account Data: Retained while your account is active and for 7 years after account closure</li>
                      <li>Financial Data: Retained for 7 years after disconnection or account closure, or as required by financial regulations</li>
                      <li>AI Interaction Data: Retained for 5 years for service improvement, then anonymized or deleted</li>
                      <li>Support Communications: Retained for 3 years after resolution</li>
                      <li>Security Logs: Retained for 2 years for security monitoring purposes</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">b. Anonymization and Aggregation</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Data may be anonymized and aggregated for research and development purposes</li>
                      <li>Anonymized data may be retained indefinitely as it no longer identifies you</li>
                      <li>Aggregated usage statistics may be retained for business analytics</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">c. Legal and Regulatory Requirements</h3>
                    <p className="ml-4 mb-2">Some data may be retained longer to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-8">
                      <li>Comply with legal, regulatory, or contractual obligations</li>
                      <li>Resolve disputes or enforce agreements</li>
                      <li>Meet audit and compliance requirements</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">d. User-Requested Deletion</h3>
                    <p className="ml-4 mb-2">You may request deletion of your data at any time by:</p>
                    <ul className="list-disc list-inside space-y-1 ml-8">
                      <li>Using the account deletion feature in Platform settings</li>
                      <li>Contacting support@incluya.com with a deletion request</li>
                      <li>Following the data deletion procedures outlined in Section 6</li>
                    </ul>
                    <p className="ml-4 mt-2">
                      <span className="font-semibold">Deletion Timeline:</span> We will process deletion requests within 30 days, except where retention is required by law.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">5. Your Rights</h2>
                <p className="text-sm leading-relaxed mb-4">
                  Depending on your jurisdiction, you may have the following rights:
                </p>
                
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">a. Universal Rights</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Access: Request access to the personal data we hold about you</li>
                      <li>Correction: Request correction of inaccurate or incomplete information</li>
                      <li>Deletion: Request deletion of your personal data ("right to be forgotten")</li>
                      <li>Portability: Request a copy of your data in a structured, machine-readable format</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">b. California Residents (CCPA/CPRA)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Right to Know: Categories of personal information collected, sources, and purposes</li>
                      <li>Right to Delete: Deletion of personal information, subject to legal exceptions</li>
                      <li>Right to Opt-Out: Opt-out of the sale of personal information (we do not sell data)</li>
                      <li>Right to Non-Discrimination: Equal service regardless of privacy rights exercise</li>
                      <li>Right to Limit Use: Limit use of sensitive personal information</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">c. EU/UK Residents (GDPR/UK GDPR)</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Lawful Basis: Information about the legal basis for processing</li>
                      <li>Consent Withdrawal: Withdraw consent where processing is based on consent</li>
                      <li>Object to Processing: Object to processing based on legitimate interests</li>
                      <li>Restrict Processing: Request restriction of processing in certain circumstances</li>
                      <li>Data Protection Officer: Contact our Data Protection Officer for privacy concerns</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">d. Other State Privacy Laws</h3>
                    <p className="ml-4">Residents of Virginia, Colorado, Connecticut, and other states with comprehensive privacy laws have similar rights as described above.</p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">e. Exercising Your Rights</h3>
                    <p className="ml-4 mb-2">To exercise your privacy rights:</p>
                    <ul className="list-disc list-inside space-y-1 ml-8">
                      <li>Email: support@incluya.com with "Privacy Rights Request" in the subject line</li>
                      <li>Platform: Use the privacy settings in your account dashboard</li>
                      <li>Verification: We may require identity verification to process requests</li>
                      <li>Response Time: We will respond within 30 days (45 days for complex requests)</li>
                      <li>Free Exercise: Privacy rights requests are processed free of charge</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">6. Security Measures</h2>
                <p className="text-sm leading-relaxed">
                  We take data protection very seriously and implement:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm leading-relaxed ml-4 mt-2">
                  <li>Encryption of data in transit and at rest via industry-standard protocols</li>
                  <li>Role-based access controls to limit internal access</li>
                  <li>Intrusion detection systems and regular penetration testing</li>
                  <li>Secure server infrastructure hosted on reputable cloud platforms, including Supabase</li>
                </ul>
                <p className="text-sm leading-relaxed mt-3">
                  Despite these safeguards, no system is entirely secure. By using Incluya, you acknowledge residual risks remain, and we are not liable for breaches resulting from user negligence or third-party actions beyond our reasonable control.
                </p>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">7. Data Breach Response</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">a. Internal Response</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Immediate Assessment: Rapid assessment of breach scope and impact</li>
                      <li>Containment: Immediate steps to contain and remediate the breach</li>
                      <li>Investigation: Thorough investigation to determine cause and extent</li>
                      <li>Documentation: Comprehensive documentation of breach and response</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">b. User Notification</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Notification Timeline: Users affected by breaches will be notified within 72 hours when required by law</li>
                      <li>Notification Method: Email, Platform notification, and/or postal mail as appropriate</li>
                      <li>Information Provided: Description of breach, data involved, and steps taken</li>
                      <li>User Actions: Recommended actions users should take to protect themselves</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">c. Regulatory Notification</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Regulatory Reporting: Timely notification to applicable regulatory authorities</li>
                      <li>Compliance: Full compliance with breach notification requirements</li>
                      <li>Cooperation: Full cooperation with regulatory investigations</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">d. Remediation and Support</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Identity Protection: Assistance with identity protection services when appropriate</li>
                      <li>Account Security: Enhanced account security measures</li>
                      <li>Ongoing Monitoring: Continued monitoring for breach-related risks</li>
                      <li>Support Services: Dedicated support for breach-affected users</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">8. Children's Privacy</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">a. Age Requirements</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Minimum Age: Platform is intended for users aged 18 and older</li>
                      <li>Parental Consent: Users under 18 must have verifiable parental or guardian consent</li>
                      <li>Age Verification: We may implement age verification measures</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">b. COPPA Compliance</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>No Knowing Collection: We do not knowingly collect personal data from children under 13</li>
                      <li>Parental Rights: Parents have rights to access, correct, or delete their child's information</li>
                      <li>Prompt Deletion: If we learn we have collected information from a child under 13 without consent, we will delete it promptly</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">9. Cookies and Tracking Technologies</h2>
                <p className="text-sm leading-relaxed mb-4">
                  We use the following types of cookies and similar technologies:
                </p>
                
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">a. Types of Cookies</h3>
                    
                    <div className="ml-4 space-y-3">
                      <div>
                        <p className="font-semibold">Essential Cookies:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Session Management: Maintain your login session and Platform functionality</li>
                          <li>Security: Protect against fraud and unauthorized access</li>
                          <li>Load Balancing: Optimize Platform performance and reliability</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-semibold">Analytics Cookies:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Usage Analytics: Google Analytics (anonymized) to understand Platform usage</li>
                          <li>Performance Monitoring: Application performance and error tracking</li>
                          <li>A/B Testing: Feature testing to improve user experience</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-semibold">Preference Cookies:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Settings: Remember your preferences and customization choices</li>
                          <li>Accessibility: Maintain accessibility settings and preferences</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">b. Cookie Management</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Browser Controls: You may disable cookies through your browser settings</li>
                      <li>Functionality Impact: Disabling cookies may limit Platform functionality</li>
                      <li>Opt-Out Options: Specific opt-out options for analytics and non-essential cookies</li>
                      <li>Cookie Policy: Detailed cookie information available in our Cookie Policy</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">c. Do Not Track</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>DNT Support: We honor Do Not Track signals where technically feasible</li>
                      <li>Limitations: Some tracking may be necessary for Platform functionality and security</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">10. AI and Machine Learning Privacy</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">a. AI Data Processing</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Training Data: User interactions may be used to improve AI models (with opt-out available)</li>
                      <li>Anonymization: Personal identifiers removed from AI training data where possible</li>
                      <li>Model Security: AI models protected with appropriate security measures</li>
                      <li>Bias Mitigation: Regular testing and mitigation of algorithmic bias</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">11. Data Transfers</h2>
                <p className="text-sm leading-relaxed">
                  Incluya operates in the United States. If you access the Platform from outside the U.S., your data may be transferred, stored, or processed in the U.S., where privacy laws may differ from your local laws.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  We implement appropriate safeguards (such as Standard Contractual Clauses) for international data transfers as required by applicable law.
                </p>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">12. Changes to This Privacy Policy</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">a. Notification of Changes</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Material Changes: 30-day advance notice via email and Platform notification</li>
                      <li>Minor Changes: Notice via Platform and updated "Last Updated" date</li>
                      <li>Version Control: Clear version numbering and change summaries</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">b. User Options</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Review Period: 30-day period to review changes before they take effect</li>
                      <li>Objection Rights: Right to object to material changes</li>
                      <li>Account Closure: Option to close account if you disagree with changes</li>
                      <li>Continued Use: Continued use constitutes acceptance of changes</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">c. Change Documentation</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Change Log: Detailed log of policy changes and effective dates</li>
                      <li>Previous Versions: Access to previous policy versions for reference</li>
                      <li>Rationale: Explanation of reasons for significant changes</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">13. Contact Us</h2>
                <p className="text-sm leading-relaxed">
                  If you have questions or concerns about this Privacy Policy or your data, please contact us at: support@incluya.com.
                </p>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">14. Dispute Resolution</h2>
                <p className="text-sm leading-relaxed">
                  Any disputes regarding this Privacy Policy are subject to the laws and jurisdiction outlined in our Terms and Conditions.
                </p>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">15. Severability and Interpretation</h2>
                <div className="space-y-4 text-sm leading-relaxed">
                  <div>
                    <h3 className="font-semibold mb-2">a. Severability</h3>
                    <p className="ml-4 mb-2">If any provision of this Privacy Policy is found invalid or unenforceable:</p>
                    <ul className="list-disc list-inside space-y-1 ml-8">
                      <li>Remaining Provisions: All other provisions remain in full force and effect</li>
                      <li>Modification: Invalid provisions will be modified to be enforceable while preserving intent</li>
                      <li>Continued Operation: Privacy Policy continues to operate effectively</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">b. Interpretation</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Plain Language: Policy written in plain language for user understanding</li>
                      <li>User-Friendly: Interpretation favors clear, user-friendly understanding</li>
                      <li>Legal Compliance: Interpretation ensures compliance with applicable privacy laws</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">16. Effective Date and Acknowledgment</h2>
                <p className="text-sm leading-relaxed mb-4">
                  By using the Incluya Platform, you acknowledge that you have read, understood, and agree to the collection, use, and disclosure of your information as described in this Privacy Policy.
                </p>
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold">Questions or Concerns?</span> We're committed to protecting your privacy. If you have any questions or concerns about this Privacy Policy or our data practices, please don't hesitate to contact us at support@incluya.com.
                </p>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Continue Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleContinue} 
            className="bg-white hover:bg-gray-100 text-black font-dm-sans font-medium px-8 py-3 text-base rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
