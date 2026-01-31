# Interview "War Story": The 100MB Git Ghost

**Context:** "Tell me about a technical challenge you faced while building your FileFly project."

---

## The Narrative Script

"I faced a really interesting issue regarding Git internals and storage management while building the backend.

I was implementing the file upload feature and, naturally, I was testing it with real files—some pretty large videos and binaries. After I got the feature working, I went to push my code to GitHub, and I got hit with a hard rejection: **'Remote file violates 100MB size limit.'**

At first, I thought, 'Oh, oops, I left a test file in there.' So, I just deleted the file from my folder, made a new commit: `git commit -m "remove large file"`, and tried to push again.

**And it failed again. Same error.**

This was confusing because if I looked at my file explorer, the file was gone. But GitHub was still rejecting the push.

That's when I had to dig into how Git actually works. I realized that **Git is a history tracker, not just a file saver.** Even though I deleted the file in *Commit B*, the file still existed inside *Commit A*. Pushing my branch sends *both* commits, so I was effectively still trying to upload that 150MB blob to GitHub's servers as part of the history.

**So, I had to fix two things:**

1.  ** The Remote Push:** I couldn't just 'add a delete commit'. I had to actually rewrite history. I used `git reset --soft` to unbundle my recent commits, completely uncalculated the large file so it was never 'added' in the first place, and then created a fresh clean commit. That solved the push error.
2.  **The Local Bloat:** This was the subtle part. Even after I fixed the commit history, I checked my project folder size and it was still HUGE—like 160MB for a simple text project.
    *   I did some research and learned about **Git's Reflog**. Git is really paranoid about data loss; even if you 'delete' a commit or a file from history, Git keeps the actual data blob in a 'recycle bin' (the reflog) effectively forever, just in case you messed up.
    *   To fix this, I had to run a low-level maintenance command: `git gc --prune=now --aggressive`. This forced Git to immediately collect the garbage and delete those unreferenced blobs.
    *   My repo size dropped from 160MB to 20MB instantly.

**The Lesson:** It taught me to be way more careful with my `.gitignore` files *before* I start coding features that generate data. I now ensure `uploads/`, `node_modules/`, and system files are ignored immediately so they never accidentally pollute the Git history."

---

## Technical Keywords to Drop
*   "Git Blobs" / "Binary Objects"
*   "Commit History vs. Working Directory"
*   "Squashing commits" / "Rewriting History"
*   "Garbage Collection" (`git gc`)
*   "Dangling commits/objects"
