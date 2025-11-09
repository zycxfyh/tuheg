module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'build', // 构建系统或外部依赖的更改
        'chore', // 其他更改（不修改src或测试文件）
        'ci', // CI配置文件和脚本的更改
        'docs', // 文档更改
        'feat', // 新功能
        'fix', // 修复bug
        'perf', // 性能优化
        'refactor', // 重构（既不修复bug也不添加功能）
        'revert', // 撤销之前的提交
        'style', // 代码风格更改（不影响代码含义）
        'test', // 添加或修改测试
        'wip', // 工作进行中
      ],
    ],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'scope-empty': [0, 'never'],
  },
}
