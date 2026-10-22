if (!slug || slug === 'ai' || slug === 'ai.html' || slug.includes('.')) {
    return context.next();
}
