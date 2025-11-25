"use client";

import { useTheme } from "next-themes@0.4.6";
import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      offset={16}
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:bg-slate-900/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:border-slate-800/50 group-[.toaster]:shadow-2xl group-[.toaster]:text-white',
          description: 'group-[.toast]:text-slate-400',
          actionButton: 'group-[.toast]:bg-purple-600 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2 group-[.toast]:font-medium',
          cancelButton: 'group-[.toast]:bg-slate-800 group-[.toast]:text-slate-300 group-[.toast]:rounded-lg group-[.toast]:px-4 group-[.toast]:py-2',
          error: 'group-[.toaster]:bg-red-950/95 group-[.toaster]:border-red-900/50 group-[.toaster]:text-red-100',
          success: 'group-[.toaster]:bg-emerald-950/95 group-[.toaster]:border-emerald-900/50 group-[.toaster]:text-emerald-100',
          warning: 'group-[.toaster]:bg-amber-950/95 group-[.toaster]:border-amber-900/50 group-[.toaster]:text-amber-100',
          info: 'group-[.toaster]:bg-blue-950/95 group-[.toaster]:border-blue-900/50 group-[.toaster]:text-blue-100',
        },
        style: {
          padding: '16px 20px',
          fontSize: '15px',
          fontWeight: '500',
          borderRadius: '16px',
          backdropFilter: 'blur(20px)',
          minHeight: '56px',
          maxWidth: 'calc(100vw - 32px)',
          width: '100%',
        },
      }}
      expand={false}
      richColors={false}
      visibleToasts={3}
      duration={3000}
      {...props}
    />
  );
};

export { Toaster };