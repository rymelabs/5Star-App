import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const TermsOfService = () => {
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
          <h1 className="page-header ml-3">Terms of Service</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Last Updated */}
        <div className="card p-4 bg-primary-500/10 border border-primary-500/20">
          <p className="text-sm text-primary-300">
            <strong>Last Updated:</strong> October 6, 2025
          </p>
        </div>

        {/* Agreement to Terms */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-400" />
            Agreement to Terms
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              These Terms of Service ("Terms") govern your access to and use of the 5Star Premier League mobile application 
              ("App"), developed and operated by RymeLabs ("we," "us," or "our"). By accessing or using the App, you agree 
              to be bound by these Terms.
            </p>
            <p>
              <strong className="text-white">PLEASE READ THESE TERMS CAREFULLY BEFORE USING THE APP.</strong> If you do not 
              agree to these Terms, you must not access or use the App.
            </p>
          </div>
        </div>

        {/* Eligibility */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">1. Eligibility</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              You must be at least 13 years old to use the App. By using the App, you represent and warrant that you meet 
              this age requirement and have the legal capacity to enter into these Terms.
            </p>
            <p>
              If you are under 18 years old, you must have permission from a parent or guardian to use the App.
            </p>
          </div>
        </div>

        {/* User Accounts */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">2. User Accounts</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              To access certain features of the App, you may be required to create an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
            <p className="pt-2">
              We reserve the right to suspend or terminate your account if we believe you have violated these Terms or 
              engaged in fraudulent or illegal activity.
            </p>
          </div>
        </div>

        {/* License to Use */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">3. License to Use the App</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, 
              revocable license to download, install, and use the App on your personal device for your personal, 
              non-commercial use.
            </p>
            <p>You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Modify, adapt, or create derivative works of the App</li>
              <li>Reverse engineer, decompile, or disassemble the App</li>
              <li>Remove, alter, or obscure any proprietary notices</li>
              <li>Use the App for any commercial purpose without our permission</li>
              <li>Distribute, sublicense, or transfer the App to third parties</li>
              <li>Use automated systems to access the App</li>
            </ul>
          </div>
        </div>

        {/* Acceptable Use */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-400" />
            4. Acceptable Use Policy
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>When using the App, you agree to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Comply with all applicable laws and regulations</li>
              <li>Respect the rights of other users</li>
              <li>Use the App only for lawful purposes</li>
              <li>Provide accurate information</li>
              <li>Maintain the security of your account</li>
            </ul>
          </div>
        </div>

        {/* Prohibited Activities */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-400" />
            5. Prohibited Activities
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use the App in any way that could damage, disable, or impair the service</li>
              <li>Attempt to gain unauthorized access to any part of the App or related systems</li>
              <li>Upload or transmit viruses, malware, or other malicious code</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Impersonate any person or entity</li>
              <li>Collect or harvest personal information about other users</li>
              <li>Engage in any fraudulent activity</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with or disrupt the App or servers</li>
              <li>Use the App to spam or send unsolicited messages</li>
            </ul>
          </div>
        </div>

        {/* Content and Intellectual Property */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">6. Content and Intellectual Property</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              All content, features, and functionality of the App, including but not limited to text, graphics, logos, 
              images, and software, are the exclusive property of RymeLabs or the 5Star Premier League and are protected 
              by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You retain ownership of any content you submit through the App. By submitting content, you grant us a 
              worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display such content in 
              connection with operating the App.
            </p>
          </div>
        </div>

        {/* Third-Party Services */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">7. Third-Party Services</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              The App may contain links to third-party websites or services. We are not responsible for the content, 
              privacy policies, or practices of third-party sites. Your use of third-party services is at your own risk.
            </p>
          </div>
        </div>

        {/* Disclaimer of Warranties */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            8. Disclaimer of Warranties
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p className="uppercase font-semibold text-white">
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
            </p>
            <p>
              We do not warrant that the App will be uninterrupted, error-free, or free from viruses or other harmful 
              components. We make no guarantees regarding the accuracy, reliability, or completeness of any content or 
              information provided through the App.
            </p>
          </div>
        </div>

        {/* Limitation of Liability */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">9. Limitation of Liability</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p className="uppercase font-semibold text-white">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, RYMELABS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
              CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE APP.
            </p>
            <p>
              Our total liability to you for all claims arising from your use of the App shall not exceed the amount you 
              have paid us in the past 12 months, or $100, whichever is greater.
            </p>
          </div>
        </div>

        {/* Indemnification */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">10. Indemnification</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              You agree to indemnify, defend, and hold harmless RymeLabs, the 5Star Premier League, and their officers, 
              directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including 
              reasonable attorneys' fees) arising out of or in any way connected with:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Your access to or use of the App</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Any content you submit through the App</li>
            </ul>
          </div>
        </div>

        {/* Termination */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">11. Termination</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              We reserve the right to suspend or terminate your access to the App at any time, with or without notice, 
              for any reason, including if we believe you have violated these Terms.
            </p>
            <p>
              Upon termination, your right to use the App will immediately cease. All provisions of these Terms that by 
              their nature should survive termination shall survive, including ownership provisions, warranty disclaimers, 
              and limitations of liability.
            </p>
          </div>
        </div>

        {/* Governing Law */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">12. Governing Law</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which 
              RymeLabs operates, without regard to its conflict of law provisions.
            </p>
          </div>
        </div>

        {/* Changes to Terms */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">13. Changes to Terms</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the 
              updated Terms on this page and updating the "Last Updated" date. Your continued use of the App after such 
              changes constitutes your acceptance of the new Terms.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">14. Contact Us</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>If you have any questions about these Terms, please contact us:</p>
            <div className="pt-2 space-y-1">
              <p><strong>Email:</strong> <a href="mailto:RymeLabs@gmail.com" className="text-primary-400 hover:text-primary-300">RymeLabs@gmail.com</a></p>
              <p><strong>Company:</strong> RymeLabs</p>
              <p><strong>App:</strong> 5Star Premier League</p>
            </div>
          </div>
        </div>

        {/* Acknowledgment */}
        <div className="card p-4 bg-primary-500/10 border border-primary-500/20">
          <p className="text-sm text-primary-300">
            By using the 5Star Premier League App, you acknowledge that you have read, understood, and agree to be bound 
            by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
