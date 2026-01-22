import React, { useState } from 'react';
import { Send, Mail, User, MessageSquare, CheckCircle2 } from 'lucide-react';
import FadeIn from './FadeIn';
import { supabase } from '../src/lib/supabase/client';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const { data, error: sendError } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        }
      });

      if (sendError) {
        throw sendError;
      }

      // Success
      setSent(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset sent status after 5 seconds
      setTimeout(() => setSent(false), 5000);
    } catch (err: any) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again later.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <section className="pt-32 pb-24 px-6 min-h-screen flex items-center justify-center">
        <FadeIn>
          <div className="glass-panel p-12 max-w-lg w-full text-center space-y-6 border-t-2 border-t-neon-teal">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-neon-teal/10 rounded-full flex items-center justify-center border-2 border-neon-teal/30">
                <CheckCircle2 className="w-10 h-10 text-neon-teal" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Message Sent!</h2>
            <p className="text-gray-400">
              Thank you for contacting us. We'll get back to you within 24 hours.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-neon-blue font-mono text-xs uppercase tracking-[0.2em] border border-neon-blue/20 px-8 py-3 hover:bg-neon-blue/10 transition-all"
            >
              Send Another Message
            </button>
          </div>
        </FadeIn>
      </section>
    );
  }

  return (
    <section className="pt-32 pb-24 px-6 min-h-screen">
      <FadeIn>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white uppercase tracking-tighter mb-4">
              Contact Us
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Have questions? We're here to help. Send us a message and we'll respond within 24 hours.
            </p>
          </div>

          <div className="glass-panel p-8 md:p-12 border-t-2 border-t-neon-blue">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    <User size={12} />
                    Name
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-neon-blue focus:outline-none transition-colors"
                    placeholder="Your full name"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    <Mail size={12} />
                    Email
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-neon-blue focus:outline-none transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Subject Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                  <MessageSquare size={12} />
                  Subject
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-neon-blue focus:outline-none transition-colors"
                  placeholder="What's this about?"
                />
              </div>

              {/* Message Field */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                  <MessageSquare size={12} />
                  Message
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:border-neon-blue focus:outline-none transition-colors resize-none"
                  placeholder="Tell us what's on your mind..."
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  disabled={sending}
                  className={`flex items-center gap-3 px-8 py-4 font-bold uppercase tracking-[0.2em] text-xs transition-all ${
                    sending 
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                      : 'bg-neon-blue text-obsidian hover:bg-neon-blue/90'
                  }`}
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Contact Info */}
            <div className="mt-12 pt-8 border-t border-white/10 text-center">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                For Research Inquiries Only
              </p>
              <p className="text-gray-400 text-sm">
                All products are for laboratory research purposes only
              </p>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
};

export default Contact;