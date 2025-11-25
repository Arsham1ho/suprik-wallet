import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface EmojiSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (emoji: string) => void;
  currentEmoji?: string;
}

export function EmojiSelector({ open, onOpenChange, onSelect, currentEmoji }: EmojiSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('animals');

  const emojiCategories = {
    animals: {
      name: 'Animals',
      icon: '🐶',
      emojis: [
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
        '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
        '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
        '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞',
        '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐',
        '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋',
        '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘',
        '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃',
      ],
    },
    planets: {
      name: 'Planets & Space',
      icon: '🪐',
      emojis: [
        '🌍', '🌎', '🌏', '🌕', '🌖', '🌗', '🌘', '🌑',
        '🌒', '🌓', '🌔', '🌙', '🌚', '🌝', '🌛', '🌜',
        '⭐', '🌟', '✨', '💫', '🌠', '☄️', '🪐', '🌌',
        '🔭', '🛸', '🚀', '🛰️', '☀️', '⚡', '🔥', '💥',
      ],
    },
    food: {
      name: 'Food',
      icon: '🍕',
      emojis: [
        '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒',
        '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆',
        '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄',
        '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨',
        '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓',
        '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙',
        '🧆', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿',
        '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛',
        '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮',
        '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑',
        '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁',
        '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛',
        '☕', '🍵', '🧃', '🥤', '🍶', '🍺', '🍻', '🥂',
        '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊',
      ],
    },
    objects: {
      name: 'Objects',
      icon: '⚽',
      emojis: [
        '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
        '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
        '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊',
        '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿',
        '⛷️', '🏂', '🪂', '🏋️', '🤸', '🤺', '🤼', '🤾',
        '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎗️', '🏵️',
        '🎫', '🎟️', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧',
        '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻',
        '🎲', '♟️', '🎯', '🎳', '🎮', '🎰', '🧩', '🪅',
        '🪆', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴',
      ],
    },
    nature: {
      name: 'Nature',
      icon: '🌸',
      emojis: [
        '🌸', '🌺', '🌼', '🌻', '🌷', '🌹', '🥀', '🏵️',
        '🌱', '🌲', '🌳', '🌴', '🌵', '🌾', '🌿', '☘️',
        '🍀', '🍁', '🍂', '🍃', '🪴', '🌊', '💧', '💦',
        '🌈', '⚡', '❄️', '☃️', '⛄', '☄️', '🔥', '💥',
        '🌪️', '🌩️', '⛈️', '🌧️', '🌦️', '🌥️', '☁️', '🌤️',
        '⛅', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖',
      ],
    },
    items: {
      name: 'Items & Things',
      icon: '💎',
      emojis: [
        '💎', '💍', '👑', '🎩', '🎓', '👒', '⛑️', '📿',
        '💄', '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕',
        '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👖', '👚',
        '🧥', '🧦', '👠', '👡', '👢', '🥾', '🥿', '👞',
        '⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '💽',
        '💾', '💿', '📀', '📷', '📹', '🎥', '📞', '☎️',
        '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭',
        '⏰', '⏱️', '⏲️', '⌛', '⏳', '📡', '🔋', '🔌',
        '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵',
        '💴', '💶', '💷', '💰', '💳', '🪙', '💎', '⚖️',
        '🪜', '🧰', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🔩',
        '⚙️', '🪛', '🧲', '🔫', '💣', '🧨', '🪓', '🔪',
        '🗡️', '⚔️', '🛡️', '🚬', '⚰️', '⚱️', '🏺', '🔮',
      ],
    },
    smileys: {
      name: 'Smileys & Faces',
      icon: '😊',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
        '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
        '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
        '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
        '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
        '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
        '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵',
        '😵‍💫', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐',
        '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳',
        '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭',
        '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱',
        '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️',
      ],
    },
    hearts: {
      name: 'Hearts & Symbols',
      icon: '💜',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤',
        '🤍', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗',
        '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️',
        '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎',
        '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏',
        '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️',
        '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️',
        '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵',
        '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘',
        '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢',
        '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭',
        '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆',
        '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅',
        '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', '🔷',
      ],
    },
  };

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-[95vw] sm:max-w-lg max-h-[85vh] p-4">
        <DialogHeader>
          <DialogTitle className="text-lg">Choose Your Avatar</DialogTitle>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {Object.entries(emojiCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedCategory === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="text-base">{category.icon}</span>
              <span className="hidden sm:inline">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 overflow-y-auto max-h-[55vh] p-1">
          {emojiCategories[selectedCategory as keyof typeof emojiCategories].emojis.map((emoji, index) => (
            <motion.button
              key={index}
              onClick={() => handleSelect(emoji)}
              className={`p-2.5 sm:p-3 text-xl sm:text-2xl rounded-lg hover:bg-slate-800 transition-all active:scale-95 ${
                currentEmoji === emoji ? 'bg-purple-600 ring-2 ring-purple-400' : 'bg-slate-900'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {emoji}
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800">
          <p className="text-xs sm:text-sm text-slate-400">
            {emojiCategories[selectedCategory as keyof typeof emojiCategories].emojis.length} emojis
          </p>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="border-slate-700 text-sm h-8"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
