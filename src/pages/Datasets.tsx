import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileText, Database, Download, Trash2, Eye, Hash } from "lucide-react";
import { useDatasetStore } from "@/stores";
import { parseCSV, generateHash } from "@/services/api";
import { Dataset, ParsedCSV } from "@/types";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function Datasets() {
  const { datasets, addDataset, removeDataset } = useDatasetStore();
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedCSV | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setUploading(true);
    try {
      const parsed = await parseCSV(file);
      const csvContent = await file.text();
      const hash = await generateHash(csvContent);

      const dataset: Dataset = {
        id: crypto.randomUUID(),
        name: file.name.replace('.csv', ''),
        rows: parsed.stats.totalRows,
        schema: parsed.schema,
        sha256: hash,
        createdAt: new Date().toISOString(),
        size: file.size,
        source: 'upload'
      };

      addDataset(dataset);
      toast.success('Dataset uploaded successfully!');
    } catch (error) {
      toast.error('Failed to parse CSV file');
      console.error(error);
    } finally {
      setUploading(false);
    }
  }, [addDataset]);

  const loadSampleDataset = async (sampleName: string) => {
    setUploading(true);
    try {
      const response = await fetch(`/samples/${sampleName}.csv`);
      const csvContent = await response.text();
      const file = new File([csvContent], `${sampleName}.csv`, { type: 'text/csv' });
      
      const parsed = await parseCSV(file);
      const hash = await generateHash(csvContent);

      const dataset: Dataset = {
        id: crypto.randomUUID(),
        name: sampleName.charAt(0).toUpperCase() + sampleName.slice(1),
        rows: parsed.stats.totalRows,
        schema: parsed.schema,
        sha256: hash,
        createdAt: new Date().toISOString(),
        size: csvContent.length,
        source: 'sample'
      };

      addDataset(dataset);
      toast.success(`Sample ${sampleName} dataset loaded!`);
    } catch (error) {
      toast.error('Failed to load sample dataset');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
    disabled: uploading
  });

  const handleDelete = (id: string) => {
    removeDataset(id);
    toast.success('Dataset deleted');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Datasets
          </h1>
          <p className="text-muted-foreground">
            Manage your data sources and upload new datasets
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Dataset
          </CardTitle>
          <CardDescription>
            Drag and drop a CSV file or click to browse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200",
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-border hover:border-primary/50 hover:bg-accent/50",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p>Processing file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm">
                  {isDragActive
                    ? "Drop the CSV file here..."
                    : "Drag & drop a CSV file here, or click to select"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Only CSV files are supported
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => loadSampleDataset('fitness')}
              disabled={uploading}
            >
              Load Fitness Sample
            </Button>
            <Button
              variant="outline"
              onClick={() => loadSampleDataset('bank')}
              disabled={uploading}
            >
              Load Banking Sample
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Datasets List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Your Datasets ({datasets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {datasets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No datasets uploaded yet</p>
              <p className="text-sm">Upload a CSV file to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
                      <Database className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{dataset.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{dataset.rows.toLocaleString()} rows</span>
                        <span>{dataset.schema.length} columns</span>
                        {dataset.size && <span>{formatBytes(dataset.size)}</span>}
                        {dataset.source === 'sample' && (
                          <Badge variant="secondary">Sample</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDataset(dataset)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Dataset Details: {(selectedDataset ?? dataset).name}</DialogTitle>
                          <DialogDescription>
                            Schema and metadata information
                          </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[70vh] pr-2">
                          <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label>Rows</Label>
                              <p className="font-mono">{(selectedDataset ?? dataset).rows.toLocaleString()}</p>
                            </div>
                            <div>
                              <Label>Columns</Label>
                              <p className="font-mono">{(selectedDataset ?? dataset).schema.length}</p>
                            </div>
                            <div>
                              <Label>Created</Label>
                              <p className="font-mono">
                                {new Date((selectedDataset ?? dataset).createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <Label>SHA-256 Hash</Label>
                              <p className="font-mono text-xs break-all">{(selectedDataset ?? dataset).sha256}</p>
                            </div>
                          </div>
                          
                          <div>
                            <Label>Schema</Label>
                            <div className="mt-2 max-h-[50vh] overflow-auto rounded-md border border-border/50">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Column</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>PII</TableHead>
                                  <TableHead>Nullable</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(selectedDataset ?? dataset).schema?.map((column, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="font-mono">{column.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{column.type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      {column.pii ? (
                                        <Badge variant="destructive">Yes</Badge>
                                      ) : (
                                        <Badge variant="secondary">No</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={column.nullable ? "outline" : "secondary"}>
                                        {column.nullable ? "Yes" : "No"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            </div>
                          </div>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(dataset.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}