import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileCheck, Database, Shield, Users, Bell, Target, Lock, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';

const TermsConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-dark-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h1 className="page-header ml-3">Terms & Conditions</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Last Updated */}
        <div className="card p-4 bg-primary-500/10 border border-primary-500/20">
          <p className="text-sm text-primary-300">
            <strong>Last Updated:</strong> October 6, 2025
          </p>
        </div>

        {/* Introduction */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-primary-400" />
            Introduction and Acceptance
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              Welcome to the 5Star Premier League mobile application ("App"). These Terms and Conditions ("Terms") constitute 
              a legally binding agreement between you ("User," "you," or "your") and RymeLabs ("Company," "we," "us," or "our"), 
              governing your access to and use of the 5Star Premier League App and all related services, features, content, 
              and applications offered by RymeLabs.
            </p>
            <p>
              <strong className="text-white">BY DOWNLOADING, INSTALLING, ACCESSING, OR USING THE APP, YOU EXPRESSLY ACKNOWLEDGE 
              AND AGREE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS AND CONDITIONS IN THEIR ENTIRETY.</strong> 
              If you do not agree to these Terms, you must immediately cease all use of the App and uninstall it from your device.
            </p>
            <p>
              These Terms apply to all visitors, users, and others who access or use the App, whether registered or unregistered. 
              Your use of the App is also subject to our Privacy Policy, which is incorporated herein by reference.
            </p>
          </div>
        </div>

        {/* Data Collection Consent - MAIN SECTION */}
        <div className="card p-6 border-2 border-primary-500/30">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-6 h-6 text-primary-400" />
            Data Collection and User Consent
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-4">
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                IMPORTANT: MANDATORY DATA COLLECTION
              </p>
              <p className="text-yellow-200/90">
                By using this App, you explicitly consent and agree to allow RymeLabs to collect, process, store, and analyze 
                various types of personal and non-personal information as detailed in this section. This data collection is 
                essential for the operation, improvement, and quality assurance of the App.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3 text-base">1. Personal Information Collection</h3>
              <p className="mb-3">
                You acknowledge and expressly consent that RymeLabs will collect, process, and store the following personal 
                information that you provide during registration, account setup, or while using the App:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-white">Full Legal Name:</strong> Your complete name as provided during registration, 
                  used for account identification, personalization, and communication purposes
                </li>
                <li>
                  <strong className="text-white">Email Address:</strong> Your primary email address for account verification, 
                  security notifications, service updates, promotional communications, password recovery, and direct contact 
                  from RymeLabs or authorized third parties
                </li>
                <li>
                  <strong className="text-white">Phone Number:</strong> Your mobile or telephone number for account security, 
                  two-factor authentication, SMS notifications about matches and updates, emergency communications, and quality 
                  assurance follow-ups
                </li>
                <li>
                  <strong className="text-white">Profile Information:</strong> Including but not limited to profile pictures, 
                  avatars, biographical information, date of birth, location data, and any other information you choose to 
                  provide in your user profile
                </li>
                <li>
                  <strong className="text-white">Authentication Credentials:</strong> Usernames, passwords (stored in encrypted 
                  format), security questions, and authentication tokens
                </li>
                <li>
                  <strong className="text-white">Social Media Information:</strong> If you choose to link your social media 
                  accounts, we may collect your social media profile information, friend lists, and public posts
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3 text-base">2. App Usage Statistics and Behavioral Data</h3>
              <p className="mb-3">
                You hereby consent to RymeLabs' collection and analysis of comprehensive usage statistics and behavioral data 
                for quality assurance, service improvement, and analytical purposes, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-white">Session Information:</strong> Complete records of your app sessions including 
                  login times, logout times, session duration, frequency of visits, time spent on each screen, and patterns 
                  of app usage across different times of day and days of the week
                </li>
                <li>
                  <strong className="text-white">Feature Interaction Data:</strong> Detailed logs of every feature you use, 
                  buttons you click, screens you view, search queries you perform, filters you apply, and any other interactions 
                  with the App's user interface
                </li>
                <li>
                  <strong className="text-white">Content Engagement Metrics:</strong> Records of news articles you read 
                  (including time spent reading), teams you follow or unfollow, players you track, match details you view, 
                  league tables you access, and any content you share or bookmark
                </li>
                <li>
                  <strong className="text-white">Navigation Patterns:</strong> Your navigation paths through the App, including 
                  the sequence of pages visited, backtracking behavior, menu usage, and overall navigation efficiency
                </li>
                <li>
                  <strong className="text-white">Notification Interactions:</strong> Detailed analytics on push notifications 
                  sent to you, including delivery status, open rates, click-through rates, dismissal actions, and notification 
                  preferences you configure
                </li>
                <li>
                  <strong className="text-white">Search Behavior:</strong> All search queries you enter, search results you 
                  click, filters you apply, and patterns in your search behavior
                </li>
                <li>
                  <strong className="text-white">Preference Settings:</strong> Your notification preferences, theme selections, 
                  language choices, and any other customization settings you configure
                </li>
                <li>
                  <strong className="text-white">User-Generated Content:</strong> Any comments, ratings, reviews, or feedback 
                  you submit through the App
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3 text-base">3. Device and Technical Information</h3>
              <p className="mb-3">
                You consent to the automatic collection of technical and device information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-white">Device Identifiers:</strong> Unique device ID, advertising ID, IMEI number, 
                  MAC address, and other persistent device identifiers
                </li>
                <li>
                  <strong className="text-white">Device Specifications:</strong> Device model, manufacturer, operating system 
                  version, screen resolution, available storage space, battery status, and hardware capabilities
                </li>
                <li>
                  <strong className="text-white">Network Information:</strong> IP address, ISP information, connection type 
                  (WiFi/cellular), network strength, and data usage statistics
                </li>
                <li>
                  <strong className="text-white">Location Data:</strong> GPS coordinates, WiFi access points, cell tower 
                  information, and approximate geographic location (with your permission)
                </li>
                <li>
                  <strong className="text-white">Performance Metrics:</strong> App loading times, response times, crash reports, 
                  error logs, memory usage, CPU usage, and battery consumption
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3 text-base">4. Quality Assurance Purposes</h3>
              <p className="mb-3">
                You specifically agree that RymeLabs may use all collected data for comprehensive quality assurance purposes, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Identifying and diagnosing technical issues, bugs, and performance bottlenecks</li>
                <li>Testing new features, updates, and improvements before public release</li>
                <li>Conducting A/B testing to optimize user experience and interface design</li>
                <li>Analyzing user behavior patterns to identify areas for improvement</li>
                <li>Monitoring app stability, reliability, and overall performance metrics</li>
                <li>Evaluating the effectiveness of new features and updates</li>
                <li>Generating usage reports and analytics for internal review and improvement</li>
                <li>Training machine learning models to enhance personalization and recommendations</li>
                <li>Preventing fraud, abuse, and security threats</li>
                <li>Ensuring compliance with legal and regulatory requirements</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3 text-base">5. Data Retention and Storage</h3>
              <p className="mb-2">
                You acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>RymeLabs will retain your personal information and usage data for as long as your account is active</li>
                <li>Data may be retained after account deletion if required by law or for legitimate business purposes</li>
                <li>Anonymous and aggregated data may be retained indefinitely for statistical and analytical purposes</li>
                <li>Data is stored on secure servers that may be located in different geographic locations</li>
                <li>Backup copies of data may be maintained for disaster recovery purposes</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-3 text-base">6. Data Sharing and Third-Party Access</h3>
              <p className="mb-2">
                You consent to RymeLabs sharing your collected data with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong className="text-white">Analytics Providers:</strong> Third-party analytics services for usage analysis 
                  and performance monitoring
                </li>
                <li>
                  <strong className="text-white">Cloud Service Providers:</strong> Companies providing hosting, storage, and 
                  infrastructure services
                </li>
                <li>
                  <strong className="text-white">Marketing Partners:</strong> Authorized partners for promotional communications 
                  (with opt-out options)
                </li>
                <li>
                  <strong className="text-white">5Star Premier League:</strong> The league organization for operational and 
                  promotional purposes
                </li>
                <li>
                  <strong className="text-white">Legal Authorities:</strong> When required by law or to protect rights and safety
                </li>
              </ul>
            </div>

            <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
              <p className="text-primary-300 font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                YOUR EXPRESS CONSENT
              </p>
              <p className="text-primary-200/90">
                By using this App, you provide your explicit, informed, and voluntary consent to all data collection practices 
                described in this section. You understand that this data collection is integral to the App's functionality and 
                that refusing to provide this consent may limit or prevent your use of certain features or the App entirely.
              </p>
            </div>
          </div>
        </div>

        {/* User Rights and Responsibilities */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-400" />
            User Rights and Responsibilities
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-2">Your Rights</h3>
              <p className="mb-2">Subject to applicable laws, you have the right to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate or incomplete data</li>
                <li>Request deletion of your personal information (subject to legal retention requirements)</li>
                <li>Object to certain types of data processing</li>
                <li>Withdraw consent for optional data collection (may affect app functionality)</li>
                <li>Export your data in a portable format</li>
                <li>Lodge a complaint with a data protection authority</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">Your Responsibilities</h3>
              <p className="mb-2">As a user of the App, you agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide accurate and truthful information during registration and use</li>
                <li>Maintain the security and confidentiality of your account credentials</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
                <li>Use the App in accordance with all applicable laws and regulations</li>
                <li>Respect the intellectual property rights of RymeLabs and third parties</li>
                <li>Not engage in any activity that could harm or disrupt the App or other users</li>
                <li>Not attempt to circumvent security measures or access restricted areas</li>
                <li>Update your information promptly when it changes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Account Management */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary-400" />
            Account Management and Security
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              When you create an account with the App, you must provide accurate, complete, and current information. Failure 
              to do so constitutes a breach of these Terms and may result in immediate termination of your account.
            </p>
            <p>
              You are responsible for safeguarding your account password and for all activities that occur under your account. 
              You agree to immediately notify RymeLabs of any unauthorized use of your account or any other breach of security. 
              RymeLabs cannot and will not be liable for any loss or damage arising from your failure to maintain the security 
              of your account credentials.
            </p>
            <p>
              RymeLabs reserves the right to suspend or terminate your account at any time, with or without notice, for any 
              reason, including but not limited to violation of these Terms, fraudulent activity, or abuse of the App's features.
            </p>
          </div>
        </div>

        {/* Notifications and Communications */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary-400" />
            Notifications and Communications
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              By using the App, you consent to receive electronic communications from RymeLabs, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Push notifications about matches, teams, and news you follow</li>
              <li>Email communications regarding account activity, security, and updates</li>
              <li>SMS messages for authentication and important alerts (if you provide your phone number)</li>
              <li>In-app messages and announcements</li>
              <li>Promotional communications about new features and updates (with opt-out option)</li>
              <li>Customer support communications</li>
              <li>Legal and policy update notifications</li>
            </ul>
            <p className="pt-2">
              You may opt out of certain communications through your account settings, but some communications (such as security 
              alerts and important service updates) cannot be disabled while your account remains active.
            </p>
          </div>
        </div>

        {/* Intellectual Property */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary-400" />
            Intellectual Property Rights
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              The App and its entire contents, features, and functionality (including but not limited to all information, 
              software, text, displays, images, video, audio, design, selection, and arrangement) are owned by RymeLabs, 
              the 5Star Premier League, or their licensors and are protected by international copyright, trademark, patent, 
              trade secret, and other intellectual property or proprietary rights laws.
            </p>
            <p>
              You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the App strictly 
              in accordance with these Terms. You may not:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Reproduce, distribute, modify, create derivative works of, publicly display, or publicly perform the App</li>
              <li>Extract or attempt to extract the source code of the App</li>
              <li>Remove, alter, or obscure any copyright, trademark, or other proprietary rights notice</li>
              <li>Use the App for any commercial purpose without explicit written permission</li>
              <li>License, sell, rent, lease, transfer, assign, or otherwise commercially exploit the App</li>
            </ul>
          </div>
        </div>

        {/* Limitation of Liability */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-yellow-400" />
            Limitation of Liability
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p className="uppercase font-semibold text-white">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL RYMELABS, THE 5STAR PREMIER LEAGUE, OR 
              THEIR DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, 
              OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4 text-gray-300">
              <li>Your access to or use of or inability to access or use the App</li>
              <li>Any conduct or content of any third party on the App</li>
              <li>Any content obtained from the App</li>
              <li>Unauthorized access, use, or alteration of your transmissions or content</li>
              <li>Any bugs, viruses, trojan horses, or the like that may be transmitted through the App</li>
              <li>Any errors or omissions in any content or for any loss or damage incurred from use of any content</li>
            </ul>
            <p className="pt-2">
              Our total liability to you for all claims arising from your use of the App shall not exceed the greater of 
              $100 USD or the amount you have paid us in the twelve (12) months preceding the claim.
            </p>
          </div>
        </div>

        {/* Modifications to Terms */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Modifications to Terms and Conditions</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              RymeLabs reserves the right, at our sole discretion, to modify, update, or replace these Terms and Conditions 
              at any time. We will provide notice of material changes by posting the updated Terms on this page, updating the 
              "Last Updated" date, and/or sending you a notification through the App or via email.
            </p>
            <p>
              Your continued use of the App following the posting of revised Terms means that you accept and agree to the 
              changes. You are expected to check this page periodically so you are aware of any changes, as they are binding 
              on you.
            </p>
            <p>
              If you do not agree to the modified Terms, you must stop using the App and delete your account.
            </p>
          </div>
        </div>

        {/* Termination */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Termination</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              We may terminate or suspend your account and access to the App immediately, without prior notice or liability, 
              for any reason whatsoever, including without limitation if you breach these Terms.
            </p>
            <p>
              Upon termination, your right to use the App will immediately cease. If you wish to terminate your account, you 
              may simply discontinue using the App and request account deletion through the settings menu.
            </p>
            <p>
              All provisions of these Terms which by their nature should survive termination shall survive termination, 
              including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </div>
        </div>

        {/* Governing Law and Dispute Resolution */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Governing Law and Dispute Resolution</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which RymeLabs 
              operates, without regard to its conflict of law provisions.
            </p>
            <p>
              Any dispute arising out of or relating to these Terms or the App shall first be attempted to be resolved through 
              good faith negotiations between the parties. If the dispute cannot be resolved through negotiation, it shall be 
              submitted to binding arbitration in accordance with the rules of the applicable arbitration association.
            </p>
            <p>
              You agree to waive any right to a jury trial or to participate in a class action lawsuit against RymeLabs.
            </p>
          </div>
        </div>

        {/* Severability */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Severability and Waiver</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and 
              interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable law, 
              and the remaining provisions will continue in full force and effect.
            </p>
            <p>
              No waiver by RymeLabs of any term or condition set forth in these Terms shall be deemed a further or continuing 
              waiver of such term or condition or a waiver of any other term or condition, and any failure of RymeLabs to 
              assert a right or provision under these Terms shall not constitute a waiver of such right or provision.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Contact Information</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              If you have any questions, concerns, or requests regarding these Terms and Conditions, please contact us at:
            </p>
            <div className="pt-2 space-y-1">
              <p><strong>Email:</strong> <a href="mailto:RymeLabs@gmail.com" className="text-primary-400 hover:text-primary-300">RymeLabs@gmail.com</a></p>
              <p><strong>Company:</strong> RymeLabs</p>
              <p><strong>Application:</strong> 5Star Premier League Official App</p>
            </div>
            <p className="pt-3">
              We aim to respond to all inquiries within 48 business hours.
            </p>
          </div>
        </div>

        {/* Final Acknowledgment */}
        <div className="card p-6 bg-primary-500/10 border-2 border-primary-500/30">
          <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-primary-400" />
            Acknowledgment and Agreement
          </h2>
          <div className="text-primary-200 text-sm leading-relaxed space-y-3">
            <p className="font-semibold">
              BY CLICKING "I ACCEPT," DOWNLOADING, INSTALLING, OR USING THE 5STAR PREMIER LEAGUE APP, YOU ACKNOWLEDGE THAT:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You have read and understood these Terms and Conditions in their entirety</li>
              <li>You agree to be bound by all terms, conditions, and provisions herein</li>
              <li>You specifically consent to RymeLabs collecting, processing, and storing your personal information including 
                  your name, email address, and phone number</li>
              <li>You agree to RymeLabs collecting comprehensive app usage statistics for quality assurance purposes</li>
              <li>You understand that failure to provide required information or consent may limit your use of the App</li>
              <li>You accept all risks associated with using the App</li>
              <li>You have the legal capacity to enter into this binding agreement</li>
            </ul>
            <p className="pt-3 font-semibold text-white">
              If you do not agree to these Terms and Conditions, you must not use the App and should immediately uninstall 
              it from your device.
            </p>
          </div>
        </div>

        {/* Effective Date */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            These Terms and Conditions were last updated on October 6, 2025, and are effective immediately upon your acceptance.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            © {new Date().getFullYear()} RymeLabs. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
