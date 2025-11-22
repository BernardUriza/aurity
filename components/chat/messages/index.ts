/**
 * Chat Messages Sub-Components
 *
 * SOLID Architecture:
 * - S: Each component has a single responsibility
 * - O: Components are open for extension via props/composition
 * - L: All buttons/interactive elements follow same interface
 * - I: Props interfaces are minimal and focused
 * - D: Components depend on abstractions (props), not concrete implementations
 */

export { ChatMessagesContainer } from './ChatMessagesContainer';
export { ChatMessagesContent } from './ChatMessagesContent';
export { LoadMoreButton } from './LoadMoreButton';
export { ScrollToBottomFAB } from './ScrollToBottomFAB';
export { Watermark } from './Watermark';
export { ScreenReaderAnnouncer } from './ScreenReaderAnnouncer';
export { ScrollSnapAnchor } from './ScrollSnapAnchor';

// Types
export type { ChatMessagesContainerProps } from './ChatMessagesContainer';
export type { LoadMoreButtonProps } from './LoadMoreButton';
export type { ScrollToBottomFABProps } from './ScrollToBottomFAB';
