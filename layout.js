import './globals.css';

export const metadata = {
  title: 'Valentine Heart Jump',
  description: 'Mobile-friendly 15-second Valentine canvas game built with Next.js App Router.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
