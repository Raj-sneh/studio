
'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Mic2, Music, Sparkles, ArrowRight, GraduationCap } from 'lucide-react';

const ARTICLES = [
  {
    slug: 'beginners-piano-guide',
    title: 'A Complete Guide to Learning Piano for Absolute Beginners',
    description: 'Start your musical journey with our comprehensive guide covering everything from posture to your first melody.',
    icon: Music,
    category: 'Piano Basics'
  },
  {
    slug: 'ai-voice-cloning-science',
    title: 'The Science Behind AI Voice Cloning and its Future in Music',
    description: 'Explore the neural technology powering modern music production and high-fidelity vocal synthesis.',
    icon: Mic2,
    category: 'AI Technology'
  },
  {
    slug: 'piano-finger-dexterity-exercises',
    title: '10 Daily Exercises to Improve Finger Dexterity on Piano',
    description: 'Build strength and independence with these essential drills designed for digital and virtual keyboards.',
    icon: Sparkles,
    category: 'Practice Techniques'
  },
  {
    slug: 'compose-first-song-virtual-instruments',
    title: 'How to Use Virtual Instruments to Compose Your First Song',
    description: 'Learn the workflow of professional composers using AI-assisted tools and virtual workstations.',
    icon: BookOpen,
    category: 'Composition'
  }
];

export default function BlogListingPage() {
  return (
    <div className="space-y-12 pb-24">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-2">
          <GraduationCap className="h-3 w-3" /> Sargam Academy
        </div>
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground">Music Learning Hub</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Master the art of piano and explore the cutting edge of AI music production with our expert-curated guides.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto px-4">
        {ARTICLES.map((article) => (
          <Link href={`/blog/${article.slug}`} key={article.slug} className="group">
            <Card className="h-full border-primary/10 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:-translate-y-1 hover:shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded">
                    {article.category}
                  </span>
                  <article.icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <CardTitle className="text-2xl font-headline group-hover:text-primary transition-colors">
                  {article.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed mt-2">
                  {article.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-xs font-bold text-primary gap-2 mt-4">
                  Read Article <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
