import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "./layout";
import React from "react";

import Provider from "../Provider";
import { useRouter } from "next/router";




export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();







  
  return (
  
    <Layout>
    
      <Component {...pageProps} />
      
    </Layout>);
}
