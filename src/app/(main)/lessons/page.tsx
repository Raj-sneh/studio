
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Music, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LESSONS } from '@/lib/lessons';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LessonsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center justify-center gap-3">
          <Music className="h-8 w-8 text-primary" />
          Learn a Song
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Choose a lesson below to start practicing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {LESSONS.map((lesson) => {
          const image = PlaceHolderImages.find((img) => img.id === lesson.imageId);
          return (
            <Link href={`/lessons/${lesson.id}`} key={lesson.id} legacyBehavior>
              <a className="block group">
                <Card className="overflow-hidden h-full flex flex-col hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
                  <CardHeader className="p-0">
                    {image && (
                      <div className="aspect-video overflow-hidden">
                        <Image
                          src={image.imageUrl}
                          alt={image.description}
                          width={600}
                          height={400}
                          data-ai-hint={image.imageHint}
                          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="p-6 flex-1 flex flex-col">
                    <CardTitle className="font-headline text-2xl">{lesson.title}</CardTitle>
                    <CardDescription className="pt-2">{lesson.instrument}</CardDescription>
                    <div className="flex-grow" />
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant={lesson.difficulty === 'Beginner' ? 'secondary' : lesson.difficulty === 'Intermediate' ? 'default' : 'destructive'}>
                        {lesson.difficulty}
                      </Badge>
                      <div className="flex items-center text-sm text-primary group-hover:underline">
                        Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
