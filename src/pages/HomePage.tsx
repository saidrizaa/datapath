import { HeroSection } from '../components/landing/HeroSection';
import { LearningFlowSection } from '../components/landing/LearningFlowSection';
import { RoadmapPreviewSection } from '../components/landing/RoadmapPreviewSection';
import { PortfolioProofSection } from '../components/landing/PortfolioProofSection';
import { FaqSection } from '../components/landing/FaqSection';
import { usePageMeta } from '../lib/seo';

export function HomePage() {
  usePageMeta({
    title: 'DataPath — Belajar Analisis Data dari Excel hingga Big Data',
    description:
      'Platform belajar mandiri analisis data berbahasa Indonesia: mulai dari Excel, SQL, Python, pandas, statistik, machine learning, hingga big data dengan latihan interaktif.',
  });

  return (
    <>
      <HeroSection />
      <LearningFlowSection />
      <RoadmapPreviewSection />
      <PortfolioProofSection />
      <FaqSection />
    </>
  );
}
