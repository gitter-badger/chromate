# -*- coding: utf-8; -*-

import os
from setuptools import setup, find_packages
import json

bowerJson = json.loads(open("bower.json").read())
if bowerJson:
    version = bowerJson.get('version')
else:
    raise RuntimeError('Unable to find version string')

def get_versions():
    return version

def read(path):
    return open(os.path.join(os.path.dirname(__file__), path)).read()


requires = [
    bowerJson.get('dependencies').keys()
]

test_requires = requires + [
    bowerJson.get('devDependencies').keys()
]

setup(name='chromate',
      version=version,
      description='CRATE Chrome Extension',
      long_description='CRATE Chrome Extension',
      classifiers=[
          "Programming Language :: JavaScript",
      ],
      author='Christian Haudum',
      author_email='christian.haudum@crate.io',
      url='https://github.com/crate/crate-admin',
      keywords='CRATE, Chrome Extension',
      license='apache license 2.0',
      packages=find_packages(),
      namespace_packages=[],
      include_package_data=True,
      extras_require=dict(),
      zip_safe=False,
      install_requires=requires,
      )
