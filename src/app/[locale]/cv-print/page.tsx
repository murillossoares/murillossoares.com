'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';

type CvFrameWindow = Window & {
  setLang?: (lang: string) => void;
  setTheme?: (theme: string) => void;
};

export default function CvPrintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {  
    fetch('/gerador-cv.html')
      .then(response => response.text())
      .then(html => {      
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');      
        setHtmlContent(doc.documentElement.outerHTML);
      })
      .catch(error => console.error('Error fetching CV HTML:', error));
  }, []);

  useEffect(() => {
    if (!htmlContent) return;

    const mapTheme = (value: string) => {
      if (value === 'vscode-dark') return 'vscode';
      if (value === 'intellij-darcula') return 'intellij';
      if (value === 'sublime-monokai') return 'sublime';
      return value || 'vscode';
    };

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.srcdoc = htmlContent;
    document.body.appendChild(iframe);

    const lang = searchParams.get('lang') || locale;
    const theme = searchParams.get('theme') || 'vscode-dark';

    const cleanup = () => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    };

    iframe.onload = () => {
      try {
        const iframeWindow = iframe.contentWindow as CvFrameWindow | null;
        if (iframeWindow?.setLang && iframeWindow?.setTheme) {
          iframeWindow.setLang(lang === 'pt-br' ? 'pt' : lang);
          iframeWindow.setTheme(mapTheme(theme));
          setTimeout(() => {
            iframeWindow.print();
            cleanup();
            router.back();
          }, 500);
        } else {
          cleanup();
          router.back();
        }
      } catch (e) {
        console.error('Error interacting with iframe:', e);
        cleanup();
        router.back();
      }
    };

    return cleanup;
  }, [htmlContent, locale, router, searchParams]);

  return null;
}
