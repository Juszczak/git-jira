if !has('g:git_jira#exec_script')
  let g:git_jira#exec_script = 'git-jira-commit-msg'
endif

if !has('g:ait_jira#on_init')
  let g:ait_jira#on_init = 0
endif

function! git_jira#echo_warn(message)
  echohl WarningMsg | echom a:message | echohl None
endfunction

function! git_jira#commit_msg() abort
  let $GIT_JIRA_EOL = 1
  let l:git_jira_in_path = system('which '.g:git_jira#exec_script)
  if v:shell_error != 0
    call git_jira#echo_warn('Executable '.g:git_jira_exec_script.' script is not available.')
    return
  endif

  if &filetype != 'gitcommit'
    call git_jira#echo_warn('This command is only available when editing commit messages.')
    return
  endif

  let l:branch = system('git rev-parse --abbrev-ref HEAD | tr -d "\n"')
  echon 'Fetching commit message for branch '.l:branch.'…'
  let l:message = system(g:git_jira#exec_script.' '.l:branch.' 2>&1')
  if v:shell_error == 0
    call append(0, l:message)
    call append(1, '')
    call append(2, 'Changes made:')
    call append(3, '-  ')
    call setpos('.', [0, 4, 3, 0])
    startinsert
  else
    if v:shell_error == 127
    call git_jira#echo_warn('Something went wront when executing the '.g:git_jira#exec_script.'.')
    else
      call git_jira#echo_warn(l:message)
    endif
  endif
endfunction

command! -bar PrepareCommitMessage :call git_jira#commit_msg()
