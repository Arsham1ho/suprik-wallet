import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
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
      <DialogContent className="bg-slate-950 border-slate-800 text-white max-w-[430px] w-full max-h-[90vh] p-4 sm:p-6">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-base sm:text-lg">Choose Your Avatar</DialogTitle>
          <DialogDescription className="text-slate-400 text-xs sm:text-sm">
            Select an emoji to personalize your wallet profile
          </DialogDescription>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {Object.entries(emojiCategories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0 ${
                selectedCategory === key
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-base">{category.icon}</span>
              <span className="hidden sm:inline text-xs">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="grid grid-cols-7 gap-2 overflow-y-auto max-h-[50vh] p-1 -mx-1">
          {emojiCategories[selectedCategory as keyof typeof emojiCategories].emojis.map((emoji, index) => (
            <motion.button
              key={index}
              onClick={() => handleSelect(emoji)}
              className={`aspect-square flex items-center justify-center text-2xl rounded-xl hover:bg-slate-800/80 transition-all active:scale-95 ${
                currentEmoji === emoji ? 'bg-purple-600 ring-2 ring-purple-400 shadow-lg' : 'bg-slate-900/50'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {emoji}
            </motion.button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-800/50">
          <p className="text-xs text-slate-400">
            {emojiCategories[selectedCategory as keyof typeof emojiCategories].emojis.length} emojis
          </p>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="border-slate-700 text-xs sm:text-sm h-8 px-4"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
