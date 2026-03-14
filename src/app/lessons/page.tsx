
import Link from 'next/link';
import { Music, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LESSONS } from '@/lib/lessons';

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
        {LESSONS.map((lesson) => (
            <Link href={`/lessons/${lesson.id}`} key={lesson.id} className="block group">
                <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 transform hover:-translate-y-1 hover:shadow-primary/20">
                  <CardHeader>
                    <CardTitle className="font-headline text-2xl">{lesson.title}</CardTitle>
                    <CardDescription>{lesson.instrument}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex items-end">
                    <div className="flex items-center justify-between w-full">
                      <Badge variant={lesson.difficulty === 'Beginner' ? 'secondary' : lesson.difficulty === 'Intermediate' ? 'default' : 'destructive'}>
                        {lesson.difficulty}
                      </Badge>
                      <div className="flex items-center text-sm text-primary group-hover:underline">
                        Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}
