
const Footer = () => {
  return (
    <footer className="bg-card/50 border-t border-border/50 py-8 mt-12">
      <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Story Post. All rights reserved.</p>
        <p>Share your moments, build our community.</p>
      </div>
    </footer>
  );
};

export default Footer;
