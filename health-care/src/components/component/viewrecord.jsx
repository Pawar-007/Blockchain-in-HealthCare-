// components/component/ViewRecord.jsx
import React from "react";
import { Card, CardContent } from "../ui/Card.jsx";
import Button from "../ui/Button.jsx";
import Badge from "../ui/Badge.jsx";
import { FileText, Heart, Eye, Download } from "lucide-react";

export default function ViewRecord({ record }) {
  if (!record) return null;

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-gray-100">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold">{record.title}</h3>
            <p className="text-sm text-gray-500">{record.doctor}</p>
            <p className="text-xs text-gray-500 mt-1">{record.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {record.sharedForFunding ? (
            <Badge variant="success" className="flex items-center gap-1">
              <Heart className="h-3 w-3" /> Shared for Funding
            </Badge>
          ) : (
            <Badge variant="outline">Private</Badge>
          )}

          {/* View Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(`https://gateway.lighthouse.storage/ipfs/${record.ipfsHash}`, "_blank")
            }
          >
            <Eye className="h-4 w-4 mr-2" /> View
          </Button>

          {/* Download Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const link = document.createElement("a");
              link.href = `https://gateway.lighthouse.storage/ipfs/${record.ipfsHash}`;
              link.download = record.title;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
