import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Database, Lock, Users, AlertCircle } from 'lucide-react';
import BackButton from '../components/ui/BackButton';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center">
          <BackButton className="-ml-2" />
          <h1 className="page-header ml-3">Privacy Policy</h1>
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
            <Shield className="w-6 h-6 text-primary-400" />
            Introduction
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              Welcome to the 5Star Premier League application ("App"), developed and operated by RymeLabs ("we," "us," or "our"). 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile 
              application and related services.
            </p>
            <p>
              Please read this Privacy Policy carefully. By accessing or using the App, you acknowledge that you have read, 
              understood, and agree to be bound by all the terms of this Privacy Policy. If you do not agree with the terms 
              of this Privacy Policy, please do not access or use the App.
            </p>
          </div>
        </div>

        {/* Information We Collect */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-6 h-6 text-primary-400" />
            Information We Collect
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-4">
            <div>
              <h3 className="font-semibold text-white mb-2">1. Personal Information</h3>
              <p className="mb-2">We may collect personal information that you voluntarily provide to us, including but not limited to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Full name</li>
                <li>Email address</li>
                <li>Phone number</li>
                <li>Profile picture or avatar</li>
                <li>Username and password</li>
                <li>Date of birth</li>
                <li>Location information (if you choose to share it)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">2. Usage Data</h3>
              <p className="mb-2">We automatically collect certain information when you use the App, including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Device information (model, operating system, unique device identifiers)</li>
                <li>IP address</li>
                <li>Browser type and version</li>
                <li>Pages viewed and features accessed</li>
                <li>Time and date of access</li>
                <li>Time spent on pages</li>
                <li>Click patterns and navigation paths</li>
                <li>App performance data and crash reports</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">3. App Usage Statistics</h3>
              <p className="mb-2">We collect detailed analytics about how you interact with the App, including:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Teams you follow</li>
                <li>News articles you read</li>
                <li>Match details you view</li>
                <li>Notifications you receive and interact with</li>
                <li>Search queries</li>
                <li>Feature usage frequency</li>
                <li>Session duration and frequency</li>
                <li>User engagement metrics</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">4. Authentication Information</h3>
              <p className="mb-2">When you create an account or authenticate through third-party services, we collect:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Social media profile information (if using social login)</li>
                <li>Authentication tokens</li>
                <li>Account preferences and settings</li>
              </ul>
            </div>
          </div>
        </div>

        {/* How We Use Your Information */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-6 h-6 text-primary-400" />
            How We Use Your Information
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>We use the collected information for various purposes, including:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To provide, maintain, and improve the App and its features</li>
              <li>To personalize your experience and provide customized content</li>
              <li>To send you notifications about matches, teams, and news you follow</li>
              <li>To communicate with you about updates, security alerts, and support</li>
              <li>To analyze usage patterns and improve App performance</li>
              <li>For quality assurance and testing purposes</li>
              <li>To detect, prevent, and address technical issues</li>
              <li>To protect against fraud and unauthorized access</li>
              <li>To comply with legal obligations</li>
              <li>To conduct research and development for new features</li>
            </ul>
          </div>
        </div>

        {/* Data Sharing and Disclosure */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-400" />
            Data Sharing and Disclosure
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>We may share your information in the following circumstances:</p>
            
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-white mb-1">Service Providers</h3>
                <p>We may share your information with third-party service providers who perform services on our behalf, such as hosting, analytics, and customer support.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">Legal Requirements</h3>
                <p>We may disclose your information if required by law, court order, or governmental authority, or to protect our rights, property, or safety.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">Business Transfers</h3>
                <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.</p>
              </div>

              <div>
                <h3 className="font-semibold text-white mb-1">With Your Consent</h3>
                <p>We may share your information with third parties when you have given us explicit consent to do so.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Security */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-primary-400" />
            Data Security
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information 
              against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments and audits</li>
              <li>Access controls and authentication mechanisms</li>
              <li>Secure data storage infrastructure</li>
              <li>Employee training on data protection</li>
            </ul>
            <p className="pt-2">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive 
              to protect your personal information, we cannot guarantee its absolute security.
            </p>
          </div>
        </div>

        {/* Your Rights */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-primary-400" />
            Your Rights
          </h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>Depending on your location, you may have certain rights regarding your personal information:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Access:</strong> Request access to the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Objection:</strong> Object to the processing of your information</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
              <li><strong>Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Withdrawal:</strong> Withdraw consent for data processing</li>
            </ul>
            <p className="pt-2">
              To exercise these rights, please contact us at <a href="mailto:RymeLabs@gmail.com" className="text-primary-400 hover:text-primary-300">RymeLabs@gmail.com</a>.
            </p>
          </div>
        </div>

        {/* Children's Privacy */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Children's Privacy</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              The App is not intended for children under the age of 13. We do not knowingly collect personal information 
              from children under 13. If you are a parent or guardian and believe your child has provided us with personal 
              information, please contact us immediately.
            </p>
          </div>
        </div>

        {/* Changes to Privacy Policy */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Changes to This Privacy Policy</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
              Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy 
              Policy periodically for any changes.
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-white mb-4">Contact Us</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <div className="pt-2 space-y-1">
              <p><strong>Email:</strong> <a href="mailto:RymeLabs@gmail.com" className="text-primary-400 hover:text-primary-300">RymeLabs@gmail.com</a></p>
              <p><strong>Company:</strong> RymeLabs</p>
              <p><strong>App:</strong> 5Star Premier League</p>
            </div>
          </div>
        </div>

        {/* Consent */}
        <div className="card p-4 bg-primary-500/10 border border-primary-500/20">
          <p className="text-sm text-primary-300">
            By using the 5Star Premier League App, you acknowledge that you have read and understood this Privacy Policy 
            and agree to the collection, use, and disclosure of your information as described herein.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
