
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from 'lucide-react';

interface ConsentRequestCardProps {
  interventionPreview: any;
  onConsentResponse: (isYes: boolean) => void;
  isLoading: boolean;
}

const ConsentRequestCard: React.FC<ConsentRequestCardProps> = ({
  interventionPreview,
  onConsentResponse,
  isLoading
}) => {
  return (
    <div className="mt-4 ml-12">
      <Card className="max-w-sm bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-dm-sans font-light text-white">
            {interventionPreview.name}
          </CardTitle>
          <CardDescription className="text-xs font-dm-sans text-white/70 font-light">
            {interventionPreview.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onConsentResponse(true)}
              disabled={isLoading}
              className="flex-1 bg-green-500/70 hover:bg-green-500/80 text-white border-0 rounded-xl font-dm-sans font-light text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onConsentResponse(false)}
              disabled={isLoading}
              className="flex-1 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-xl font-dm-sans font-light text-xs"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConsentRequestCard;
