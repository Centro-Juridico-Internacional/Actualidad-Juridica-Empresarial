export function truncateBlocks(blocks: any[], maxWords: number) {
	let wordCount = 0;
	let truncatedBlocks = [];
	let truncated = false;

	for (const block of blocks) {
		if (block.type === 'paragraph' && block.children && Array.isArray(block.children)) {
			let newChildren = [];
			for (const child of block.children) {
				const words = (child.text || '').split(/\s+/);
				if (wordCount + words.length <= maxWords) {
					newChildren.push(child);
					wordCount += words.length;
				} else {
					const remaining = maxWords - wordCount;
					if (remaining > 0) {
						const truncatedText = words.slice(0, remaining).join(' ');
						newChildren.push({ ...child, text: truncatedText });
						wordCount += remaining;
					}
					truncated = true;
					break;
				}
			}
			if (newChildren.length > 0) {
				truncatedBlocks.push({ ...block, children: newChildren });
			}
			if (truncated) break;
		} else {
			truncatedBlocks.push(block);
		}
	}
	return { blocks: truncatedBlocks, truncated };
}
