import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { UserPlus, Edit2, Trash2, Copy, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useLanguage } from '../utils/i18n/LanguageContext';

interface Contact {
  id: string;
  name: string;
  address: string;
  network: string;
  createdAt: string;
}

interface AddressBookProps {
  walletId: string;
  onSelectContact?: (contact: Contact) => void;
}

export function AddressBook({ walletId, onSelectContact }: AddressBookProps) {
  const { t } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState('solana');

  useEffect(() => {
    fetchContacts();
  }, [walletId]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet/${walletId}/contacts`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const data = await response.json();
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async () => {
    if (!name.trim() || !address.trim()) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const endpoint = editingContact
        ? `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet/${walletId}/contacts/${editingContact.id}`
        : `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet/${walletId}/contacts`;

      const response = await fetch(endpoint, {
        method: editingContact ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ name, address, network }),
      });

      if (!response.ok) {
        throw new Error('Failed to save contact');
      }

      toast.success(editingContact ? 'Contact updated' : 'Contact added');
      
      // Reset form
      setName('');
      setAddress('');
      setNetwork('solana');
      setShowAddDialog(false);
      setEditingContact(null);
      
      // Refresh contacts
      fetchContacts();
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error(t.messages.error.saveFailed);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setAddress(contact.address);
    setNetwork(contact.network);
    setShowAddDialog(true);
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e5bc10d1/wallet/${walletId}/contacts/${contactId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }

      toast.success('Contact deleted');
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  const copyAddress = async (address: string, id: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedId(id);
      toast.success(t.messages.success.copied);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setNetwork('solana');
    setEditingContact(null);
    setShowAddDialog(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <p className="text-slate-400 text-sm">{t.addressBook.myContacts}</p>
        <Button
          onClick={() => setShowAddDialog(true)}
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white h-8"
        >
          <UserPlus className="w-4 h-4 mr-1" />
          {t.addressBook.addContact}
        </Button>
      </div>

      {/* Contacts List */}
      {contacts.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-slate-800/30">
          <UserPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 mb-1">{t.addressBook.noContacts}</p>
          <p className="text-slate-600 text-sm">{t.addressBook.noContactsDesc}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {contacts.map((contact, idx) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-slate-900/50 border border-slate-800/30 rounded-xl p-4 hover:border-purple-500/30 transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold mb-1">{contact.name}</h4>
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-slate-400 text-sm font-mono">
                        {truncateAddress(contact.address)}
                      </code>
                      <button
                        onClick={() => copyAddress(contact.address, contact.id)}
                        className="p-1 hover:bg-slate-800/50 rounded transition-colors"
                      >
                        {copiedId === contact.id ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500" />
                        )}
                      </button>
                    </div>
                    <span className="text-xs text-purple-400 capitalize">{contact.network}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-2">
                    {onSelectContact && (
                      <Button
                        onClick={() => onSelectContact(contact)}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                      >
                        Use
                      </Button>
                    )}
                    <button
                      onClick={() => handleEditContact(contact)}
                      className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Contact Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-slate-800/50 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? t.addressBook.editContact : t.addressBook.addContact}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingContact ? 'Update contact information' : 'Save a new contact to your address book'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Name */}
            <div>
              <Label className="text-white mb-2 block">{t.addressBook.contactName}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="bg-slate-900/50 border-slate-800/50 text-white"
              />
            </div>

            {/* Network */}
            <div>
              <Label className="text-white mb-2 block">{t.addressBook.network}</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger className="bg-slate-900/50 border-slate-800/50 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="solana">Solana</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="bitcoin">Bitcoin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div>
              <Label className="text-white mb-2 block">{t.addressBook.contactAddress}</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter wallet address"
                className="bg-slate-900/50 border-slate-800/50 text-white font-mono text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={resetForm}
                variant="outline"
                className="flex-1 border-slate-800 text-white hover:bg-slate-800/50"
              >
                {t.addressBook.cancel}
              </Button>
              <Button
                onClick={handleSaveContact}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white"
              >
                {t.addressBook.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
