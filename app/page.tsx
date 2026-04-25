import { Composer } from '@/components/sender/Composer';
import { Footer } from '@/components/shared/Footer';

export default function HomePage() {
  return (
    <div className="app-shell">
      <Composer />
      <Footer />
    </div>
  );
}
