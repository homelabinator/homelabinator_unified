import { db } from '../../db';

export async function renderSettingsModal(type: string, name?: string) {
    const modal = document.getElementById('settings-modal') as HTMLDialogElement;
    const content = document.getElementById('settings-content');
    if (!modal || !content) return;

    let title = '';
    let fields: any[] = [];
    let currentValues: any = {};

    if (type === 'global') {
        title = 'Global Settings';
        const globals = await db.globals.toArray();
        fields = globals;
        currentValues = globals.reduce((acc, g) => ({ ...acc, [g.name]: g.value }), {});
    } else {
        const item = await db.registry.get({ name });
        if (!item) return;
        title = `${item.title} Settings`;
        fields = item.fields_def || [];
        currentValues = item.fields || {};
    }

    content.innerHTML = `
        <div class="bg-white border-[5px] border-black rounded-[23px] p-10 flex flex-col gap-8 max-w-4xl w-full relative">
            <form method="dialog"><button class="absolute top-5 right-5 w-12 h-12 bg-white border-2 border-black rounded-full flex items-center justify-center text-2xl cursor-pointer">✕</button></form>
            <h1 class="text-4xl font-bold mb-4">${title}</h1>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${fields.length > 0 ? fields.map(f => {
                    let onchange = '';
                    if (type === 'global') onchange = `window.updateGlobalField('${f.name}', this.value)`;
                    else if (type === 'app') onchange = `window.updateAppField('${name}', '${f.name}', this.value)`;
                    else onchange = `window.updateField('${type}', '${name}', '${f.name}', this.value)`;
                    
                    return `
                    <div class="form-control">
                        <label class="label">
                            <span class="label-text text-xl font-bold">${f.label}${f.required ? ' <span class="text-red-500">*</span>' : ''}</span>
                        </label>
                        <input 
                            type="${f.type || 'text'}" 
                            value="${currentValues[f.name] || ''}" 
                            placeholder="${f.placeholder || ''}" 
                            ${f.required ? 'required' : ''}
                            onchange="${onchange}" 
                            class="input input-bordered input-lg border-2 border-black rounded-xl" 
                        />
                    </div>
                `;}).join('') : '<p class="text-xl opacity-60">No configurable variables for this item.</p>'}
            </div>
        </div>
    `;
    modal.showModal();
}
