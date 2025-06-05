import Post from '@/models/Post';

export async function generatePostId(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');

    const prefix = `${year}_${month}_${day}_${hours}_HEMUNG_`;

    let postId = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10000) {
        const randomNum = Math.floor(Math.random() * 1000);
        const suffix = randomNum.toString().padStart(3, '0');
        postId = `${prefix}${suffix}`;

        const existingPost = await Post.findOne({ postId });
        if (!existingPost) {
            isUnique = true;
        }
        attempts++;
    }

    if (!isUnique) {
        console.warn("Could not generate a unique post ID after multiple attempts. Consider adjusting the ID generation logic.");
        throw new Error("Failed to generate a unique Post ID.");
    }

    return postId;
} 