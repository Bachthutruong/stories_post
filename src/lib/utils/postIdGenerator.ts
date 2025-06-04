import Post from '@/models/Post';

export async function generatePostId(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');

    const prefix = `${year}_${month}_${day}_${hours}_HEMUNG_`;

    let counter = 0;
    let postId = '';
    let isUnique = false;

    while (!isUnique) {
        const suffix = counter.toString().padStart(3, '0');
        postId = `${prefix}${suffix}`;

        const existingPost = await Post.findOne({ postId });
        if (!existingPost) {
            isUnique = true;
        }

        counter = (counter + 1) % 1000; // Cycle from 000 to 999
        if (counter === 0 && !isUnique) {
            // If cycled through all 1000 numbers and still not unique, 
            // it means there are 1000 posts in the current hour, which is highly unlikely.
            // For simplicity, we'll break and return, though in a real app, 
            // you might want to handle this more robustly (e.g., add more digits or wait).
            console.warn("Generated 1000 post IDs in the same hour. Consider adjusting the ID generation logic.");
            break;
        }
    }

    return postId;
} 