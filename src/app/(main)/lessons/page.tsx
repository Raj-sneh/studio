import Link from "next/link";
import Image from "next/image";
import { lessons } from "@/lib/lessons";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LessonsPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold tracking-tight">AI Teacher Lessons</h1>
        <p className="mt-2 text-lg text-muted-foreground">Choose a lesson to start learning with AI feedback.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lessons.map((lesson) => {
          const image = PlaceHolderImages.find(img => img.id === lesson.imageId);
          return (
            <Card key={lesson.id} className="flex flex-col overflow-hidden group hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader className="p-0">
                {image && (
                  <div className="aspect-video overflow-hidden relative">
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
                <div className="flex-1">
                  <Badge variant="default" className="capitalize bg-accent text-accent-foreground">{lesson.instrument}</Badge>
                  <CardTitle className="font-headline text-xl mt-4">{lesson.title}</CardTitle>
                  <CardDescription className="text-sm mt-1">{lesson.difficulty}</CardDescription>
                </div>
                <div className="mt-6">
                  <Link href={`/lessons/${lesson.id}`} passHref>
                    <Button className="w-full">
                      Start Lesson
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
