import { updateOverlay } from './common';

export async function renderAboutPage() {
    const content = document.getElementById('main-content');
    if (!content) return;

    content.innerHTML = `
        <div class="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-20 space-y-8 md:space-y-12">
            <h1 class="text-4xl md:text-6xl font-bold text-center mb-10 md:mb-16">About Homelabinator</h1>
            
            <div class="prose prose-lg md:prose-xl max-w-none">
                <p class="text-xl md:text-2xl leading-relaxed">
                    Homelabinator is the easiest way for you to be able to replace your subscriptions with free alternatives. How you might ask? Through self-hosting.
                </p>

                <h2 class="text-2xl md:text-4xl font-bold mt-8 md:mt-12 mb-4 md:mb-6">What is "self-hosting"?</h2>
                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    To understand self-hosting it takes a bit of context on how the internet works. Say you want to listen to music from Spotify. Your phone connects to the internet, and the internet is connected to some server that is hosting "spotify.com".
                </p>

                <div class="my-6 md:my-8">
                    <img src="/assets/about-1.png" alt="About Page Diagram for Using Spotify" class="w-full rounded-[20px] md:rounded-[30px] border-2 border-black shadow-lg" />
                    <p class="text-center italic opacity-60 mt-4 text-sm md:text-base">(This is a massive over simplification)</p>
                </div>

                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    But what if that server was an old computer, that was in your living room? Now it's just a matter of finding the right software that has the same functionality has Spotify. It just so happens there is an excellent equivalent called Navidrome, and not only that, it is free!
                </p>

                <div class="my-6 md:my-8">
                    <img src="/assets/about-2.png" alt="About Page Diagram for Navidrome" class="w-full rounded-[20px] md:rounded-[30px] border-2 border-black shadow-lg" />
                </div>

                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    This applies to all kinds of services too, not just Spotify. Take a look at the home page to see what all can be replaced!
                </p>

                <h2 class="text-2xl md:text-4xl font-bold mt-8 md:mt-12 mb-4 md:mb-6">Technical Details</h2>
                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    If technical jargon scares you, then do not bother reading this, but those who are curious, press on!
                </p>

                <h3 class="text-xl md:text-3xl font-bold mt-8 md:mt-12 mb-4">How does Homelabinator work?</h3>
                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    Built on the shoulders of the giants that are <a href="https://nixos.org/" target="_blank" class="text-[#0088ff] font-bold">NixOS</a> and <a href="https://k3s.io/" target="_blank" class="text-[#0088ff] font-bold">K3s</a>, Homelabinator is an opinionated customization of NixOS. When you add the apps that you want to self-host, we create an bootable ISO that you can flash onto a USB drive. When you boot your old computer from this USB, it automatically installs the selected software and configures everything for you.
                </p>

                <h3 class="text-xl md:text-3xl font-bold mt-8 md:mt-12 mb-4">Minimum Requirements</h3>
                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    The following is the minimum requirements for an "old" computer to be able to run Homelabinator.
                </p>

                <div class="bg-[#efeef6] p-4 md:p-8 rounded-[20px] md:rounded-[30px] border-2 border-black my-6 md:my-8 overflow-x-auto">
                    <table class="w-full text-lg md:text-xl border-collapse min-w-[300px]">
                        <thead>
                            <tr class="border-b-2 border-black/10">
                                <th class="text-left py-4 px-2 md:px-4 font-bold">Component</th>
                                <th class="text-left py-4 px-2 md:px-4 font-bold">Requirement</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-black/5">
                            <tr><td class="py-4 px-2 md:px-4">CPU</td><td class="py-4 px-2 md:px-4">Dual Core x64</td></tr>
                            <tr><td class="py-4 px-2 md:px-4">Memory</td><td class="py-4 px-2 md:px-4">2GB</td></tr>
                            <tr><td class="py-4 px-2 md:px-4">Storage</td><td class="py-4 px-2 md:px-4">16GB</td></tr>
                            <tr><td class="py-4 px-2 md:px-4">USB Stick*</td><td class="py-4 px-2 md:px-4">2GB</td></tr>
                            <tr><td class="py-4 px-2 md:px-4">Internet Connection</td><td class="py-4 px-2 md:px-4">Required</td></tr>
                        </tbody>
                    </table>
                </div>

                <div class="space-y-2">
                    <p class="text-base md:text-lg opacity-60 italic">*Only needed one time for installing the OS.</p>
                    <p class="text-base md:text-lg opacity-60 italic text-[#0088ff]">NOTE: The amount of storage varies with the amount of apps that you add.</p>
                </div>

                <h3 class="text-xl md:text-3xl font-bold mt-8 md:mt-12 mb-4">Don't trust us?</h3>
                <p class="text-lg md:text-xl opacity-80 leading-relaxed">
                    All of our code is publicly accessible on <a href="https://github.com/homelabinator" target="_blank" class="text-[#0088ff] font-bold">our GitHub organization</a>! Feel free to make any issues or pull requests!
                </p>
            </div>
        </div>
    `;
    updateOverlay();
}
