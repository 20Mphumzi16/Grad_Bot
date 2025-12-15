import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { ChatPreview } from '../components/ChatPreview';
import { Features } from '../components/Features';
import { HowItWorks } from '../components/HowItWorks';
import { Footer } from '../components/Footer';

export function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <ChatPreview />
        <Features />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
