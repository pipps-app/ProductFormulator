import { useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would send the message to your chat system
    // For now, we'll just show a confirmation
    if (message.trim()) {
      alert("Message sent! We'll respond shortly via email at maker-calc@pipps.app");
      setMessage("");
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
            size="icon"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80">
          <Card className="shadow-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Live Chat Support</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-slate-600">Online</span>
                    <Badge variant="outline" className="text-xs">Mon-Fri 9AM-6PM EST</Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-700">
                  Hi! How can we help you today? Send us a message and we'll get back to you quickly.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-3">
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={!message.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </div>
              </form>
              
              <div className="text-center">
                <p className="text-xs text-slate-500">
                  Or email us at{" "}
                  <a href="mailto:maker-calc@pipps.app" className="text-blue-600 hover:underline">
                    maker-calc@pipps.app
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}