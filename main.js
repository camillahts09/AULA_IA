import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Configuração do Supabase
const SUPABASE_URL = 'https://lclgnidbvzhnzrdekelz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_yuxvImBg1Ut2FiwMEpzepQ_hWUaHF9T';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Elementos do DOM
const form = document.getElementById('pessoa-form');
const tbody = document.getElementById('pessoas-tbody');
const formTitle = document.getElementById('form-title');
const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar');
const searchInput = document.getElementById('search-input');
const toastContainer = document.getElementById('toast-container');
const emailInputGlobal = document.getElementById('email');

if (emailInputGlobal) {
    emailInputGlobal.addEventListener('invalid', function(e) {
        e.preventDefault();
        showToast('E-mail incorreto! Verifique o formato.', 'error');
        this.focus();
    });
}

let pessoasData = [];
let isEditing = false;

document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = themeBtn.querySelector('i');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });
    
    function updateThemeIcon(theme) {
        themeIcon.className = theme === 'light' ? 'ri-moon-line' : 'ri-sun-line';
    }

    fetchPessoas().catch(e => console.error("Erro fatal no fetch:", e));
    
    const nascimentoInput = document.getElementById('nascimento');
    if (nascimentoInput) {
        nascimentoInput.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 8) v = v.slice(0, 8);
            v = v.replace(/(\d{2})(\d)/, '$1/$2');
            v = v.replace(/(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
            e.target.value = v;
        });
    }
});

function parseDateForDB(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return null;
}

function formatDateForUI(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
}

async function fetchPessoas(searchQuery = '') {
    try {
        let query = supabase.from('Pessoas').select('*').order('Nome', { ascending: true });
        if (searchQuery) query = query.ilike('Nome', `%${searchQuery}%`);
        const { data, error } = await query;
        if (error) throw error;
        pessoasData = data || [];
        renderTable(pessoasData);
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
        showToast('Erro ao carregar os dados', 'error');
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Erro ao carregar dados.</td></tr>`;
    }
}

function renderTable(data) {
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="ri-inbox-line"></i><p>Nenhuma pessoa encontrada.</p></td></tr>`;
        return;
    }
    data.forEach(pessoa => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${pessoa.Nome}</strong></td>
            <td>${formatDateForUI(pessoa.Nascimento)}</td>
            <td>${pessoa.Email}</td>
            <td>${pessoa.Pai || '-'}</td>
            <td>${pessoa.Mae || '-'}</td>
            <td class="td-actions">
                <button class="btn-icon btn-edit" onclick="editPessoa('${pessoa.id}')" title="Editar"><i class="ri-pencil-line"></i></button>
                <button class="btn-icon btn-delete" onclick="deletePessoa('${pessoa.id}')" title="Excluir"><i class="ri-delete-bin-line"></i></button>
            </td>`;
        tbody.appendChild(tr);
    });
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('pessoa-id').value;
    const nome = document.getElementById('nome').value;
    const nascimentoRaw = document.getElementById('nascimento').value;
    const pai = document.getElementById('pai').value || null;
    const mae = document.getElementById('mae').value || null;
    const emailInput = document.getElementById('email');
    const email = emailInput.value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Formato de e-mail incorreto!', 'error');
        emailInput.focus();
        return;
    }

    const nascimentoDB = parseDateForDB(nascimentoRaw);
    if (!nascimentoDB) {
        showToast('Formato de data inválido. Use DD/MM/AAAA', 'error');
        return;
    }

    const payload = { Nome: nome, Nascimento: nascimentoDB, Pai: pai, Mae: mae, Email: email };
    const originalText = btnSalvar.innerHTML;
    btnSalvar.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Salvando...`;
    btnSalvar.disabled = true;

    try {
        if (isEditing && id) {
            const { error } = await supabase.from('Pessoas').update(payload).eq('id', id);
            if (error) throw error;
            showToast('Cadastro atualizado com sucesso!', 'success');
        } else {
            const { error } = await supabase.from('Pessoas').insert([payload]);
            if (error) throw error;
            showToast('Pessoa cadastrada com sucesso!', 'success');
        }
        resetForm();
        fetchPessoas(searchInput.value);
    } catch (error) {
        showToast('Erro ao salvar cadastro: ' + error.message, 'error');
    } finally {
        btnSalvar.innerHTML = originalText;
        btnSalvar.disabled = false;
    }
});

window.editPessoa = (id) => {
    const pessoa = pessoasData.find(p => p.id === id);
    if (!pessoa) return;
    document.getElementById('pessoa-id').value = pessoa.id;
    document.getElementById('nome').value = pessoa.Nome;
    document.getElementById('nascimento').value = formatDateForUI(pessoa.Nascimento);
    document.getElementById('pai').value = pessoa.Pai || '';
    document.getElementById('mae').value = pessoa.Mae || '';
    document.getElementById('email').value = pessoa.Email;
    isEditing = true;
    formTitle.innerHTML = `<i class="ri-edit-line"></i> Editar Pessoa`;
    btnSalvar.innerHTML = `<i class="ri-save-line"></i> Atualizar Cadastro`;
    btnCancelar.style.display = 'inline-flex';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

window.deletePessoa = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este cadastro?')) return;
    try {
        const { error } = await supabase.from('Pessoas').delete().eq('id', id);
        if (error) throw error;
        showToast('Cadastro excluído com sucesso.', 'success');
        fetchPessoas(searchInput.value);
    } catch (error) {
        showToast('Erro ao excluir: ' + error.message, 'error');
    }
};

function resetForm() {
    form.reset();
    document.getElementById('pessoa-id').value = '';
    isEditing = false;
    formTitle.innerHTML = `Nova Pessoa`;
    btnSalvar.innerHTML = `<i class="ri-save-line"></i> Salvar Cadastro`;
    btnCancelar.style.display = 'none';
}

btnCancelar.addEventListener('click', resetForm);

let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { fetchPessoas(e.target.value); }, 300);
});

function showToast(message, type = 'success') {
    const icon = type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line';
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="${icon}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => { if (toastContainer.contains(toast)) toastContainer.removeChild(toast); }, 3500);
}
