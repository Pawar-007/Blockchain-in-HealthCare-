import React, { useState } from "react";
import Button from "../ui/Button.jsx";
import { Input } from "../ui/Input.jsx";
import { Label } from "../ui/Label.jsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/Dialog.jsx";
import { useToast } from "../ui/use-toast.jsx";
import { Upload, FileText, Loader2 } from "lucide-react";
import { uploadToLighthouse } from "../../ipfsIntegration/uploadOnIpfs.js";
import { useContracts } from "../../context/ContractContext.jsx";
import { useMedicalRecords } from "../../context/MedicalRecordContext.jsx"; // ✅ import context

export function UploadRecordDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [doctor, setDoctor] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cid, setCid] = useState(null);

  const { toast } = useToast();
  const { account, storage } = useContracts();
  const { fetchRecords,addRecord  } = useMedicalRecords(); // ✅ get fetchRecords from context

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!title || !doctor || !description || !file) {
      toast({
        title: "Missing details",
        description: "Please fill all fields and select a file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    toast({ title: "Uploading...", description: "Please wait." });

    try {
      // ✅ 1. Ensure patient is registered
      try {
        const isRegistered = await storage.isRegistered(account);
        if (!isRegistered) {
          const regTx = await storage.registerPatient();
          await regTx.wait();
          toast({ title: "Patient registered successfully" });
        }
      } catch (regErr) {
        console.warn("Registration skipped or failed:", regErr.reason);
      }

      // ✅ 2. Upload file to Lighthouse
      const cid = await uploadToLighthouse(file);
      setCid(cid);
      toast({ title: "File uploaded", description: `CID: ${cid}` });

      // ✅ 3. Send to blockchain
      const tx = await storage.uploadRecord(title, cid, description, doctor);
      toast({ title: "Confirming transaction..." });
      const receipt = await tx.wait();

      const event = receipt.events?.find((e) => e.event === "RecordUploaded");
      if (event) {
        const { recordId, ipfsHash } = event.args;
        toast({
          title: "Record stored on blockchain",
          description: `Record ID: ${recordId.toString()}, CID: ${ipfsHash}`,
        });
        addRecord(newRecord);   //instant update in Dashboard
        await fetchRecords();
        setOpen(false);
      }

      //  4. Reset form
      setTitle("");
      setDoctor("");
      setDescription("");
      setFile(null);
      setCid(null);
    } catch (err) {
      console.error("Upload failed:", err);
      toast({
        title: "Upload failed",
        description: err.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex flex-col items-center gap-2 h-20"
        >
          <Upload className="h-6 w-6" /> Upload Medical Record
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            New Medical Record
          </DialogTitle>
          <DialogDescription>
            Fill in the details and upload your medical document.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label>Record Title *</Label>
            <Input
              placeholder="e.g. MRI Scan Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="grid gap-2">
            <Label>Doctor *</Label>
            <Input
              placeholder="Dr. John Doe"
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="grid gap-2">
            <Label>Description *</Label>
            <Input
              placeholder="Short description of the record"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
            />
          </div>

          <div className="grid gap-2">
            <Label>Medical Document *</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {cid && (
            <p className="text-sm text-green-600 break-all">
              Uploaded! CID:{" "}
              <a
                href={`https://gateway.lighthouse.storage/ipfs/${cid}`}
                target="_blank"
                rel="noreferrer"
                className="underline text-blue-600"
              >
                {cid}
              </a>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" /> Upload Record
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UploadRecordDialog;
