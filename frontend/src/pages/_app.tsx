import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "./layout";
import React from "react";
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/auth-context';
import { SuppressLayoutEffectWarning } from '@/components/suppress-layout-effect-warning';

import Provider from "../Provider";
import { useRouter } from "next/router";




export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();







  
  return (
    <Provider>
      <AuthProvider>
        <SuppressLayoutEffectWarning />
        <Layout>
          <Component {...pageProps} />
        </Layout>
        <Toaster position="top-right" />
      </AuthProvider>
    </Provider>
  );
}
