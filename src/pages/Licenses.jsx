import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileCode, ExternalLink } from 'lucide-react';
import BackButton from '../components/ui/BackButton';

const Licenses = () => {
  const navigate = useNavigate();

  const licenses = [
    {
      name: 'React',
      version: '18.x',
      license: 'MIT License',
      url: 'https://github.com/facebook/react',
      description: 'A JavaScript library for building user interfaces',
      copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.'
    },
    {
      name: 'React Router',
      version: '6.x',
      license: 'MIT License',
      url: 'https://github.com/remix-run/react-router',
      description: 'Declarative routing for React applications',
      copyright: 'Copyright (c) React Training LLC'
    },
    {
      name: 'Firebase',
      version: '10.x',
      license: 'Apache License 2.0',
      url: 'https://github.com/firebase/firebase-js-sdk',
      description: 'Firebase JavaScript SDK for web applications',
      copyright: 'Copyright (c) Google Inc.'
    },
    {
      name: 'Tailwind CSS',
      version: '3.x',
      license: 'MIT License',
      url: 'https://github.com/tailwindlabs/tailwindcss',
      description: 'A utility-first CSS framework',
      copyright: 'Copyright (c) Tailwind Labs, Inc.'
    },
    {
      name: 'Lucide React',
      version: '0.x',
      license: 'ISC License',
      url: 'https://github.com/lucide-icons/lucide',
      description: 'Beautiful & consistent icon toolkit',
      copyright: 'Copyright (c) Lucide Contributors'
    },
    {
      name: 'Vite',
      version: '5.x',
      license: 'MIT License',
      url: 'https://github.com/vitejs/vite',
      description: 'Next generation frontend tooling',
      copyright: 'Copyright (c) 2019-present, Yuxi (Evan) You and Vite contributors'
    },
    {
      name: 'date-fns',
      version: '2.x',
      license: 'MIT License',
      url: 'https://github.com/date-fns/date-fns',
      description: 'Modern JavaScript date utility library',
      copyright: 'Copyright (c) date-fns'
    }
  ];

  const mitLicenseText = `MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;

  const apacheLicenseText = `Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.`;

  const iscLicenseText = `ISC License

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.`;

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-dark-900 z-10 px-4 py-3 border-b border-dark-700">
        <div className="flex items-center">
          <BackButton className="-ml-2" />
          <h1 className="page-header ml-3">Open Source Licenses</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* Introduction */}
        <div className="card p-6">
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              The Fivescores app is built using various open source software libraries and frameworks. 
              We are grateful to the open source community for their contributions.
            </p>
            <p>
              Below is a list of the open source software used in this application, along with their respective licenses 
              and copyright information.
            </p>
          </div>
        </div>

        {/* Third-Party Libraries */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white px-2">Third-Party Libraries</h2>
          
          {licenses.map((lib, index) => (
            <div key={index} className="card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-primary-400" />
                    {lib.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Version {lib.version}</p>
                </div>
                <a
                  href={lib.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
              </div>
              
              <p className="text-sm text-gray-300 mb-3">{lib.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-primary-500/10 text-primary-300 text-xs rounded">
                    {lib.license}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{lib.copyright}</p>
              </div>
            </div>
          ))}
        </div>

        {/* MIT License Full Text */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-4">MIT License (Full Text)</h2>
          <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
              {mitLicenseText}
            </pre>
          </div>
        </div>

        {/* Apache License Full Text */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Apache License 2.0 (Summary)</h2>
          <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
              {apacheLicenseText}
            </pre>
          </div>
        </div>

        {/* ISC License Full Text */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-4">ISC License (Full Text)</h2>
          <div className="bg-dark-800 p-4 rounded-lg border border-dark-700">
            <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono leading-relaxed">
              {iscLicenseText}
            </pre>
          </div>
        </div>

        {/* Additional Attribution */}
        <div className="card p-6">
          <h2 className="text-lg font-bold text-white mb-4">Additional Attributions</h2>
          <div className="text-gray-300 text-sm leading-relaxed space-y-3">
            <p>
              <strong className="text-white">Fivescores:</strong> League data, logos, team information, 
              and fixture details are property of Fivescores.
            </p>
            <p>
              <strong className="text-white">RymeLabs:</strong> The Fivescores mobile application is 
              developed and maintained by RymeLabs.
            </p>
            <p>
              <strong className="text-white">Icons:</strong> UI icons provided by Lucide Icons (ISC License).
            </p>
            <p>
              <strong className="text-white">Fonts:</strong> System fonts and any web fonts used are subject to 
              their respective licenses.
            </p>
          </div>
        </div>

        {/* Compliance Notice */}
        <div className="card p-6 bg-primary-500/10 border border-primary-500/20">
          <h2 className="text-lg font-bold text-white mb-3">License Compliance</h2>
          <div className="text-primary-200 text-sm leading-relaxed space-y-2">
            <p>
              We are committed to complying with all open source licenses. If you believe we have not properly 
              attributed a library or have violated a license agreement, please contact us immediately at{' '}
              <a href="mailto:RymeLabs@gmail.com" className="text-primary-400 hover:text-primary-300 underline">
                RymeLabs@gmail.com
              </a>
              .
            </p>
            <p>
              All third-party libraries are used in accordance with their respective license terms and conditions.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            For the complete source code and license information of each library, please visit their respective 
            GitHub repositories or official websites.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            © {new Date().getFullYear()} RymeLabs. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Licenses;
