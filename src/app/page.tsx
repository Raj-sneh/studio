'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Music, BookOpen, Wand2, Sparkles, Mic2, Disc, ArrowRight, GraduationCap, Zap, BrainCircuit } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AnimatedMusicBackground } from '@/components/AnimatedMusicBackground';

const ARTICLES = [
  {
    slug: 'beginners-piano-guide',
    title: 'Beginners Guide',
    description: 'Master posture and your first scale.',
    icon: Music,
    color: 'text-primary'
  },
  {
    slug: 'ai-voice-cloning-science',
    title: 'Voice Science',
    description: 'The future of neural production.',
    icon: BrainCircuit,
    color: 'text-secondary'
  },
  {
    slug: 'piano-finger-dexterity-exercises',
    title: 'Dexterity Drills',
    description: '10 daily exercises for speed.',
    icon: Zap,
    color: 'text-accent'
  },
  {
    slug: 'compose-first-song-virtual-instruments',
    title: 'Composition',
    description: 'Write your first song with AI.',
    icon: BookOpen,
    color: 'text-primary'
  }
];

export default function LandingPage() {
  const practiceImg = PlaceHolderImages.find(img => img.id === 'dashboard-practice');
  const learnImg = PlaceHolderImages.find(img => img.id === 'dashboard-learn');
  const magicImg = PlaceHolderImages.find(img => img.id === 'dashboard-magic');

  return (
    <div className="relative space-y-32 pb-32">
      <AnimatedMusicBackground />
      
      {/* Hero Section */}
      <section className="text-center space-y-10 pt-20 max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest animate-bounce">
          <Sparkles className="h-3 w-3" /> Professional AI Music Studio
        </div>
        <h1 className="font-headline text-6xl md:text-8xl font-bold tracking-tight text-foreground leading-tight">
          Sargam AI: The <span className="text-primary">Voice Cloning AI</span> & Virtual Piano
        </h1>
        <p className="text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Sargam AI is the world's most intuitive Voice Cloning AI and music workstation. Practice on a high-fidelity virtual piano, learn with interactive AI tutors, or clone voices with research-grade neural technology.
        </p>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12 px-4 max-w-7xl mx-auto">
        <Link href="/suite?tab=cloner" className="group">
          <Card className="h-full overflow-hidden border-primary/10 hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm hover:-translate-y-2 shadow-2xl shadow-black/50">
            <div className="relative h-64 w-full overflow-hidden">
              <Image 
                src={magicImg?.imageUrl || ''} 
                alt="Professional Voice Cloning AI Studio" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint="AI music"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <Wand2 className="absolute bottom-6 left-6 h-10 w-10 text-primary" />
            </div>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl mb-2">Voice Cloning AI</CardTitle>
              <CardDescription className="text-base leading-relaxed">Create perfect neural clones of any voice. Use our research-preview technology to swap vocals or generate high-fidelity speech from text.</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/practice" className="group">
          <Card className="h-full overflow-hidden border-primary/10 hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm hover:-translate-y-2 shadow-2xl shadow-black/50">
            <div className="relative h-64 w-full overflow-hidden">
              <Image 
                src={practiceImg?.imageUrl || ''} 
                alt="Virtual Piano Practice Room" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint="piano practice"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <Music className="absolute bottom-6 left-6 h-10 w-10 text-primary" />
            </div>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl mb-2">Virtual Piano Studio</CardTitle>
              <CardDescription className="text-base leading-relaxed">Play our high-quality Virtual Grand Piano. Record your sessions and refine your skills in a professional environment designed for musicians.</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/lessons" className="group">
          <Card className="h-full overflow-hidden border-primary/10 hover:border-primary/30 transition-all bg-card/50 backdrop-blur-sm hover:-translate-y-2 shadow-2xl shadow-black/50">
            <div className="relative h-64 w-full overflow-hidden">
              <Image 
                src={learnImg?.imageUrl || ''} 
                alt="AI Music Learning Tutor" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                data-ai-hint="music lesson"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
              <BookOpen className="absolute bottom-6 left-6 h-10 w-10 text-primary" />
            </div>
            <CardHeader className="p-8">
              <CardTitle className="text-2xl mb-2">AI Piano Tutor</CardTitle>
              <CardDescription className="text-base leading-relaxed">Learn classics with real-time feedback from the Sargam AI tutor. Follow glowing keys and track your progress as you master the music.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </section>

      {/* Learning Hub Section */}
      <section className="max-w-7xl mx-auto px-4 space-y-16">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest mb-2">
            <GraduationCap className="h-3 w-3" /> Sargam Academy
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">Master the Art of Music</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto italic">
            Deep dive into piano techniques and the cutting edge of neural production with our expert guides.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ARTICLES.map((article) => (
            <Link href={`/blog/${article.slug}`} key={article.slug} className="group">
              <Card className="h-full border-primary/5 bg-card/30 backdrop-blur-sm transition-all hover:border-primary/20 hover:-translate-y-1">
                <CardHeader className="p-6">
                  <article.icon className={cn("h-8 w-8 mb-4 transition-transform group-hover:scale-110", article.color)} />
                  <CardTitle className="text-xl font-headline group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed mt-2 line-clamp-2">
                    {article.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-primary gap-2">
                    Read Guide <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <Link href="/blog">
            <Button variant="outline" className="rounded-full px-8 h-12 border-primary/20 hover:bg-primary/5 font-bold">
              Visit Full Learning Hub <GraduationCap className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Extended SEO Features */}
      <section className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <h2 className="text-4xl font-bold font-headline tracking-tight">Advanced <span className="text-primary">AI Music Generator</span> Tools</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Sargam AI isn't just a learning platform—it's a production suite. Use our <strong>BGM Composer</strong> to synchronize piano tracks with your vocals, or our <strong>Melody Maker</strong> to turn text descriptions into musical notation.
          </p>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <Disc className="h-5 w-5 text-primary" />
              <span className="font-medium">Neural Background Music Generation</span>
            </li>
            <li className="flex items-center gap-3">
              <Mic2 className="h-5 w-5 text-primary" />
              <span className="font-medium">High-Fidelity AI Vocal Synthesis</span>
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-medium">AI-Powered Music Reinforcement</span>
            </li>
          </ul>
        </div>
        <div className="relative aspect-square bg-primary/5 rounded-[3rem] border border-primary/10 overflow-hidden flex items-center justify-center p-12">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
           <Wand2 className="h-32 w-32 text-primary/40 animate-pulse" />
        </div>
      </section>

      {/* Footer Info Section */}
      <section className="text-center py-20 px-4">
        <p className="text-muted-foreground max-w-2xl mx-auto italic text-lg leading-relaxed">
          "Music and technology are the twin wings of human creativity. Let Voice Cloning AI and our Virtual Piano studio empower your unique sound."
        </p>
      </section>
    </div>
  );
}
