import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { StatCard as StatCardType } from "@/lib/types";

interface StatCardProps {
  card: StatCardType;
}

export function StatCard({ card }: StatCardProps) {
  const { title, value, icon, iconBg, iconColor, linkText, linkUrl } = card;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBg} rounded-md p-3`}>
            <span className={`text-xl ${iconColor}`} dangerouslySetInnerHTML={{ __html: icon }} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-slate-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-slate-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 px-5 py-3">
        <div className="text-sm">
          <Link href={linkUrl} className="font-medium text-primary hover:text-primary/80 flex items-center">
            {linkText} <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
