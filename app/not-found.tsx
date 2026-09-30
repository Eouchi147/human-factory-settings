import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-top">
      <div className="wrap-narrow stack gap-20" style={{ minHeight: "60svh", justifyContent: "center" }}>
        <div className="kick">404</div>
        <h1 className="h1">
          This setting <span className="serif">does not exist.</span>
        </h1>
        <p className="lede">The page may have moved while the site is in preview.</p>
        <div className="row-wrap gap-10">
          <Link className="btn" href="/">
            Back to the start
          </Link>
          <Link className="btn btn-ghost" href="/explore">
            Explore the body
          </Link>
        </div>
      </div>
    </div>
  );
}
