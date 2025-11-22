import React from 'react';
import { ArrowLeft } from 'lucide-react';

const actionVariants = {
  primary:
    'bg-brand-purple/40 border border-brand-purple/30 text-white hover:bg-brand-purple/60 hover:border-brand-purple/60 shadow-brand-purple/30',
  secondary:
    'bg-white/5 border border-white/10 text-white hover:bg-white/10 shadow-white/10',
  danger:
    'bg-red-500/10 border border-red-500/30 text-red-200 hover:bg-red-500/20',
};

const AdminPageLayout = ({
  title,
  subtitle,
  description,
  actions = [],
  stats = [],
  onBack,
  children,
}) => {
  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else {
      window.history.back();
    }
  };

  const sectionPadding = 'w-full px-2 sm:px-5 lg:px-12 xl:px-16 2xl:px-20';

  return (
    <>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-purple/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="sticky top-0 z-50 bg-black/30 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/20 border-b border-white/5">
        <div className="flex items-center px-4 h-14">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors -ml-2"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="ml-2">
            {subtitle && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40 mb-1">{subtitle}</p>
            )}
            <h1 className="text-lg font-bold tracking-tight text-white">{title}</h1>
          </div>
        </div>
      </div>

      <div className="admin-premium-page relative z-10 pt-6 pb-16 space-y-6">
        <div className={sectionPadding}>
          <div className="relative overflow-hidden rounded-[22px] lg:rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-[1px]">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/20 via-transparent to-blue-500/20 opacity-60 blur-3xl" />
            <div className="relative rounded-[21px] lg:rounded-[26px] bg-black/40 p-4 lg:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-white/50">{subtitle || 'Admin Control'}</p>
                  <h2 className="text-2xl font-semibold text-white mt-2">{title}</h2>
                  {description && <p className="text-white/70 mt-3 max-w-2xl text-sm leading-relaxed">{description}</p>}
                </div>
                {actions.length > 0 && (
                  <div className="flex flex-wrap gap-2.5">
                    {actions.map(({ label, icon: Icon, onClick: actionHandler, variant = 'secondary' }) => (
                      <button
                        key={label}
                        onClick={actionHandler}
                        className={`min-w-[110px] px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-[0.18em] transition-all flex items-center justify-center gap-2 shadow-lg ${
                          actionVariants[variant] || actionVariants.secondary
                        }`}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {stats.length > 0 && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {stats.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-white/5 rounded-xl border border-white/5 p-3">
                      <div className="flex items-center gap-2.5">
                        {Icon && (
                          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">{label}</p>
                          <p className="text-lg font-semibold text-white mt-1">{value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`${sectionPadding} space-y-6`}>{children}</div>
      </div>
    </>
  );
};

export default AdminPageLayout;
