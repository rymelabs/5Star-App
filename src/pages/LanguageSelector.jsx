import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const LanguageSelector = () => {
	const { language, changeLanguage, availableLanguages, t } = useLanguage();
	const navigate = useNavigate();

	const handleChoose = (code) => {
		changeLanguage(code);
		// After choosing language, go to authentication landing
		navigate('/auth', { replace: true });
	};

	return (
		<div className="min-h-screen bg-black flex items-center justify-center p-4">
			<div className="w-full max-w-lg">
				<div className="bg-dark-900 rounded-2xl p-8 shadow-xl text-center">
					<h1 className="text-2xl font-bold text-white mb-4">Select your language</h1>
					<p className="text-gray-400 mb-6">Choose the language you prefer for the app.</p>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{availableLanguages.map((lang) => (
							<button
								key={lang.code}
								onClick={() => handleChoose(lang.code)}
								className={`p-4 rounded-lg border-2 ${language === lang.code ? 'border-primary-500 bg-primary-600/10' : 'border-gray-700'} hover:scale-[1.02] transition-transform`}
							>
								<div className="text-left">
									<div className="font-semibold text-white">{lang.nativeName}</div>
									<div className="text-sm text-gray-400">{lang.name}</div>
								</div>
							</button>
						))}
					</div>

					<div className="mt-6">
						<button
							onClick={() => navigate('/auth')}
							className="text-sm text-primary-400 hover:text-primary-300"
						>
							Continue without changing
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LanguageSelector;
