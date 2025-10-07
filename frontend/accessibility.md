# Accessibility Statement - GenText AI

## Conformance Level
GenText AI aims to conform to Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA.

## Accessibility Features

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Skip links provided to main content
- Focus management for modals and dropdowns
- Logical tab order throughout the application

### Screen Reader Support
- Semantic HTML structure with proper headings hierarchy
- ARIA labels and roles where appropriate
- Alt text for all meaningful images
- Screen reader announcements for dynamic content

### Visual Design
- Color contrast ratios meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Content is readable at 200% zoom
- Focus indicators are clearly visible
- No information conveyed by color alone

### Motion & Animation
- Respects `prefers-reduced-motion` user preferences
- No auto-playing content without user control
- Parallax effects disabled for users who prefer reduced motion

### Form Accessibility
- All form controls have associated labels
- Error messages are clearly announced
- Form validation provides clear feedback

## Known Issues
Currently, there are no known accessibility issues. We continuously monitor and test for accessibility compliance.

## Feedback
If you encounter any accessibility barriers while using GenText AI, please contact us:
- Email: accessibility@gentextai.com
- We aim to respond to accessibility feedback within 2 business days

## Testing
We regularly test our application using:
- Automated tools: axe-core, Lighthouse Accessibility
- Manual testing: Keyboard navigation, screen reader testing
- User testing with assistive technology users

## Last Updated
This accessibility statement was last updated on: ${new Date().toLocaleDateString()}

## Standards Referenced
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Section 508 Standards](https://www.section508.gov/)