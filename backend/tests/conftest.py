# -*- coding: utf-8 -*-
"""全局测试夹具。"""
import pytest


@pytest.fixture(autouse=True)
def _no_access_token(monkeypatch):
    """默认关闭访问口令：业务测试不被认证中间件拦截。

    认证行为本身在 tests/test_access_auth.py 里用 monkeypatch.setenv 单独验证。
    """
    monkeypatch.setenv("ACCESS_TOKEN", "")
