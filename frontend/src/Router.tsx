// import React, { Suspense, lazy } from 'react';
// import { BrowserRouter, Routes, Route } from 'react-router-dom';
//
// const Home = lazy(() => import('./pages/Home'));
// const LoginForm = lazy(() => import('./pages/Login'));
// const NotFound = lazy(() => import('./pages/NotFound'));
//
// const Router = () => {
//     return (
//         <BrowserRouter>
//             <Suspense fallback={<div>Loading...</div>}>
//                 <Routes>
//                     <Route path="/" element={<Home />} />
//                     <Route path="/login" element={<LoginForm />} />
//                     <Route path="*" element={<NotFound />} />
//                 </Routes>
//             </Suspense>
//         </BrowserRouter>
//     );
// }
//
// export default Router;
