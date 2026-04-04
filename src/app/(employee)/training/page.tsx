import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, Users, Coffee, UtensilsCrossed, ChefHat, Shield,
  ClipboardList, Sparkles, Wine, AlertCircle, Smartphone,
  FileText, GraduationCap, Briefcase, Heart, Droplets,
} from "lucide-react";

const sectionIcons: Record<string, any> = {
  "new-hire-onboarding": GraduationCap,
  "server-training": UtensilsCrossed,
  "bartender-training": Wine,
  "host-training": Users,
  "kitchen-training": ChefHat,
  "manager-training": Briefcase,
  "opening-procedures": ClipboardList,
  "closing-procedures": ClipboardList,
  "side-work": Sparkles,
  "guest-experience": Heart,
  "allergy-protocol": AlertCircle,
  "food-safety": Shield,
  "menu-knowledge": Coffee,
  "pos-basics": Smartphone,
  "hr-policies": FileText,
  "cleaning-sanitation": Droplets,
};

export default async function TrainingLibraryPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [sections, completions] = await Promise.all([
    db.section.findMany({
      where: { isActive: true },
      include: {
        modules: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
    userId ? db.moduleCompletion.findMany({ where: { userId } }) : Promise.resolve([]),
  ]);

  const completedIds = new Set(completions.map((c) => c.moduleId));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Training Library</h1>
        <p className="text-gray-500 mt-1">Browse all Ditch training sections and modules</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => {
          const Icon = sectionIcons[section.slug] || BookOpen;
          const totalModules = section.modules.length;
          const completedModules = section.modules.filter((m) => completedIds.has(m.id)).length;

          return (
            <Link key={section.id} href={`/training/${section.slug}`}>
              <Card hover className="h-full">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-ditch-orange/10 rounded-xl shrink-0">
                    <Icon className="w-6 h-6 text-ditch-orange" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{section.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-gray-400">{totalModules} modules</span>
                      {completedModules > 0 && (
                        <Badge variant="completed">
                          {completedModules}/{totalModules} done
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
